// src/server.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const { testConnection, sequelize } = require('./config/db')

// Importar modelos (Sequelize los registra)
require('./models')

// Rutas
const leadRoutes = require('./router/leadRoutes')
const createChatRoutes = require('./router/chatRoutes')

// ============================
// EXPRESS APP
// ============================
const app = express()

// ============================
// CORS HTTP + WS
// ============================
const allowedOrigins = [
  'https://grupoalade.com',
  'https://www.grupoalade.com',
  'https://solar-calculator.cingulado.org',
  'https://aladeapp.cingulado.org',
  'http://localhost:5173',
  'http://localhost:3000',
]

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)

app.use(express.json())

// ============================
// RUTAS HTTP BÁSICAS
// ============================
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API Solar Calculator funcionando' })
})

// ping simple de chat
app.get('/api/chat/ping', (req, res) => {
  res.json({ ok: true, message: 'chat API viva' })
})

// Leads (HTTP puro)
app.use('/api/leads', leadRoutes)

// ============================
// HTTP SERVER + SOCKET.IO
// ============================
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
})

// Manejo de WebSocket
io.on('connection', socket => {
  console.log('🟢 Socket conectado:', socket.id)

  socket.on('joinSession', ({ sessionId }) => {
    if (!sessionId) return
    const room = String(sessionId)
    socket.join(room)
    socket.data.sessionId = room
    console.log(`👉 ${socket.id} entró a la sesión ${room}`)
  })

  socket.on('chatMessage', payload => {
    const { sessionId } = payload || {}
    if (!sessionId) return

    const room = String(sessionId)

    io.to(room).emit('chatMessage', {
      ...payload,
      sessionId: room,
      createdAt: new Date().toISOString(),
    })
  })

  socket.on('disconnect', () => {
    console.log('🔴 Socket desconectado:', socket.id)
  })
})

// ============================
// RUTAS HTTP DE CHAT (con acceso a io)
// ============================
// ⚠️ Importante: se crean DESPUÉS de instanciar io
const chatRoutes = createChatRoutes(io)
app.use('/api/chat', chatRoutes)

// ============================
// START SERVER
// ============================
const PORT = process.env.PORT || 4000

async function start () {
  try {
    await testConnection()

    // Migraciones automáticas
    await sequelize.sync({ alter: true })
    console.log('[DB] Migraciones sincronizadas')

    server.listen(PORT, () => {
      console.log(`[API+WS] Escuchando en puerto ${PORT}`)
    })
  } catch (err) {
    console.error('[API] Error al iniciar:', err)
    process.exit(1)
  }
}

start()

module.exports = { app, server, io }
