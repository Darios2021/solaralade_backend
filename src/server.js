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
  })
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
  const role = socket.handshake?.auth?.role || 'unknown'
  console.log('🟢 Socket conectado:', socket.id, 'role=', role)

  // Lo dejo por si a futuro querés rooms, pero hoy no dependemos de esto
  socket.on('joinSession', ({ sessionId }) => {
    if (!sessionId) return
    socket.join(sessionId)
    socket.data.sessionId = sessionId
    console.log(`👉 ${socket.id} entró a la sesión ${sessionId}`)
  })

  socket.on('chatMessage', payload => {
    const { sessionId } = payload || {}

    const enriched = {
      ...payload,
      sessionId: sessionId || socket.data.sessionId || null,
      createdAt: new Date().toISOString(),
    }

    if (!enriched.sessionId) {
      console.warn(
        '[WS] chatMessage SIN sessionId, payload=',
        JSON.stringify(payload),
      )
    } else {
      console.log(
        `[WS] chatMessage de ${socket.id} role=${role} → sesión ${enriched.sessionId}:`,
        enriched.message || enriched.text,
      )
    }

    // 🔥 CLAVE: lo mandamos a TODOS los clientes conectados
    io.emit('chatMessage', enriched)
  })

  socket.on('disconnect', reason => {
    console.log('🔴 Socket desconectado:', socket.id, 'motivo:', reason)
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
