// src/server.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const { testConnection, sequelize } = require('./config/db')
const { setIo } = require('./socketHub')

// Import models
require('./models')

// Rutas
const leadRoutes = require('./router/leadRoutes')
const chatRoutes = require('./router/chatRoutes')

// INIT EXPRESS
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

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

// ============================
// RUTAS HTTP
// ============================
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API Solar Calculator funcionando' })
})

app.get('/api/chat/ping', (req, res) => {
  res.json({ ok: true, message: 'chat API viva' })
})

app.use('/api/leads', leadRoutes)
app.use('/api/chat', chatRoutes)

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

setIo(io) // <-- REGISTRA EL IO GLOBAL

io.on('connection', socket => {
  console.log('🟢 Socket conectado:', socket.id)

  socket.on('joinSession', ({ sessionId }) => {
    if (!sessionId) return
    socket.join(String(sessionId))
    socket.data.sessionId = String(sessionId)
    console.log(`👉 ${socket.id} entró a la sesión ${sessionId}`)
  })

  socket.on('chatMessage', payload => {
    const { sessionId } = payload || {}
    if (!sessionId) return

    io.to(String(sessionId)).emit('chatMessage', {
      ...payload,
      createdAt: new Date().toISOString(),
    })
  })

  socket.on('disconnect', () => {
    console.log('🔴 Socket desconectado:', socket.id)
  })
})

// ============================
// START SERVER
// ============================
const PORT = process.env.PORT || 4000

async function start() {
  try {
    await testConnection()

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
