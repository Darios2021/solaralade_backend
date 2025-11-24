// src/socketHub.js
const { Server } = require('socket.io')

function createSocketServer (httpServer) {
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: '*',            // ajustá dominios si querés
      methods: ['GET', 'POST']
    },
  })

  // Conjunto de sockets que son agentes conectados
  const agents = new Set()

  function broadcastAgentsOnline () {
    io.emit('agentsOnline', { count: agents.size })
  }

  io.on('connection', socket => {
    const role = socket.handshake.query.role || 'visitor'
    const socketId = socket.id

    // AGENTE conectado
    if (role === 'agent') {
      agents.add(socketId)
      broadcastAgentsOnline()
      console.log('[WS] agente conectado', socketId, 'total agentes =', agents.size)
    } else {
      console.log('[WS] visitor conectado', socketId)
    }

    // Unirse a una sesión concreta
    socket.on('joinSession', ({ sessionId }) => {
      if (!sessionId) return
      const room = `session:${sessionId}`
      socket.join(room)
      console.log('[WS] socket', socketId, 'join', room)
    })

    // Reenviar mensajes de chat en tiempo real
    socket.on('chatMessage', payload => {
      const { sessionId } = payload || {}
      if (!sessionId) return
      const room = `session:${sessionId}`
      io.to(room).emit('chatMessage', payload)
    })

    // Indicador “agente escribiendo”
    socket.on('agentTyping', ({ sessionId, typing }) => {
      if (!sessionId) return
      const room = `session:${sessionId}`
      io.to(room).emit('agentTyping', {
        sessionId,
        typing: !!typing,
      })
    })

    socket.on('disconnect', () => {
      if (role === 'agent') {
        agents.delete(socketId)
        broadcastAgentsOnline()
        console.log('[WS] agente desconectado', socketId, 'total agentes =', agents.size)
      } else {
        console.log('[WS] visitor desconectado', socketId)
      }
    })
  })

  return io
}

module.exports = { createSocketServer }
