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
const chatRoutes = require('./router/chatRoutes')

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
  }),
)

app.use(express.json())

// ============================
// RUTAS HTTP
// ============================
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API Solar Calculator funcionando' })
})

// Prueba
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

// Manejo de WebSocket
io.on('connection', socket => {
  const role = (socket.handshake.query && socket.handshake.query.role) || 'widget'

  console.log('🟢 Socket conectado:', socket.id, 'role =', role)

  // Metemos a todos en rooms lógicas por rol
  if (role === 'agent') {
    socket.join('agents')
  } else {
    socket.join('widgets')
  }

  // (la room por sesión queda disponible si la querés usar más adelante)
  socket.on('joinSession', ({ sessionId }) => {
    if (!sessionId) return
    const room = String(sessionId)
    socket.join(room)
    socket.data.sessionId = room
    console.log(`👉 ${socket.id} entró a la sesión ${room}`)
  })

  // Mensajes de chat
  socket.on('chatMessage', payload => {
    if (!payload) return

    const sessionId = String(payload.sessionId || '')
    if (!sessionId) return

    const from = payload.from || payload.sender || 'user'

    const baseMsg = {
      ...payload,
      sessionId,
      from,
      createdAt: new Date().toISOString(),
    }

    // Log para depurar
    console.log('💬 chatMessage recibido:', baseMsg)

    // Si viene del AGENTE -> se lo mando a todos los widgets
    if (from === 'agent') {
      // a todos los widgets menos el emisor (que es un agente)
      socket.to('widgets').emit('chatMessage', baseMsg)
    } else {
      // Viene del usuario/widget/bot -> se lo mando a TODOS los agentes (CRM)
      socket.to('agents').emit('chatMessage', baseMsg)
    }

    // Opcional: si querés que los participantes de esa sesión
    // también lo reciban por la room de la sesión:
    // io.to(sessionId).emit('chatMessage', baseMsg)
  })

  socket.on('disconnect', () => {
    console.log('🔴 Socket desconectado:', socket.id, 'role =', role)
  })
})

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
