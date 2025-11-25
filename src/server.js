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

// ====== PRESENCIA POR SESIÓN ======
// Map: sessionId -> Set(socketId de agentes en ese chat)
const agentPresenceBySession = new Map()

function updateSessionAgents (sessionId) {
  const set = agentPresenceBySession.get(sessionId)
  const count = set ? set.size : 0
  // Solo lo ve el widget de ESA sesión
  io.to(sessionId).emit('agentsOnline', { sessionId, count })
}

// Manejo de WebSocket
io.on('connection', socket => {
  const role = (socket.handshake.query && socket.handshake.query.role) || 'widget'

  console.log('🟢 Socket conectado:', socket.id, 'role =', role)

  // Rooms lógicas por rol (para broadcast de mensajes, NO para presencia)
  if (role === 'agent') {
    socket.join('agents')
    console.log(`👮 Agente conectado: ${socket.id}`)
  } else {
    socket.join('widgets')
    console.log(`👤 Widget conectado: ${socket.id}`)
  }

  // Room por sesión
  socket.on('joinSession', ({ sessionId }) => {
    if (!sessionId) return
    const room = String(sessionId)

    socket.join(room)
    console.log(`👉 ${socket.id} entró a la sesión ${room}`)

    // Si es agente, marcamos presencia SOLO en esa sesión
    if (role === 'agent') {
      const prev = socket.data.currentSessionId
      // Si antes estaba "parado" en otra sesión, lo sacamos de la anterior
      if (prev && prev !== room) {
        const prevSet = agentPresenceBySession.get(prev)
        if (prevSet && prevSet.delete(socket.id)) {
          if (!prevSet.size) agentPresenceBySession.delete(prev)
          updateSessionAgents(prev)
        }
      }

      socket.data.currentSessionId = room

      let set = agentPresenceBySession.get(room)
      if (!set) {
        set = new Set()
        agentPresenceBySession.set(room, set)
      }
      set.add(socket.id)
      updateSessionAgents(room) // Notificamos al widget de ESA sesión
    }
  })

  // Indicador "agente está escribiendo"
  socket.on('agentTyping', payload => {
    if (!payload) return
    const sessionId = String(payload.sessionId || '')
    if (!sessionId) return

    const typing = !!payload.typing

    // se lo mandamos SOLO al widget de esa sesión
    io.to(sessionId).emit('agentTyping', { sessionId, typing })
  })

  // 👇 Indicador "usuario está escribiendo" (widget → agentes)
  socket.on('userTyping', payload => {
    if (!payload) return
    const sessionId = String(payload.sessionId || '')
    if (!sessionId) return

    const typing = !!payload.typing

    // se lo mandamos SOLO a los agentes (CRM), para esa sesión
    socket.to('agents').emit('userTyping', { sessionId, typing })
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

    console.log('💬 chatMessage recibido:', baseMsg)

    if (from === 'agent') {
      // 👉 Mensaje desde CRM → a widget de esa sesión
      //    EXCLUIMOS al agente emisor para que en el CRM no se duplique
      socket.to(sessionId).emit('chatMessage', baseMsg)
    } else {
      // 👉 Mensaje desde widget / bot / user → SOLO a agentes
      //    (el widget ya lo agrega localmente, no queremos eco)
      io.to('agents').emit('chatMessage', baseMsg)
    }
  })

  socket.on('disconnect', () => {
    console.log('🔴 Socket desconectado:', socket.id, 'role =', role)

    if (role === 'agent') {
      // Lo sacamos de cualquier sesión donde estuviera presente
      for (const [sessionId, set] of agentPresenceBySession.entries()) {
        if (set.delete(socket.id)) {
          if (!set.size) {
            agentPresenceBySession.delete(sessionId)
          }
          updateSessionAgents(sessionId)
        }
      }
    }
  })
})

// ============================
// START SERVER
// ============================
const PORT = process.env.PORT || 4000

async function start () {
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
