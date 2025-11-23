// src/router/chatRoutes.js
const express = require('express')
const { ChatSession, ChatMessage } = require('../models')

/**
 * Factory de rutas de chat que recibe la instancia de socket.io
 * así podemos emitir eventos desde los endpoints HTTP.
 */
function createChatRoutes (io) {
  const router = express.Router()

  // -----------------------------
  // Crear sesión de chat
  // -----------------------------
  router.post('/session', async (req, res) => {
    try {
      const { contact = {}, meta = {}, leadId = null } = req.body || {}

      const now = new Date()

      const session = await ChatSession.create({
        leadId: leadId || null,
        name: contact.name || contact.fullName || null,
        email: contact.email || null,
        phone: contact.phone || null,
        status: 'open',
        startedAt: now,
        lastActivityAt: now,

        sourceUrl: meta.sourceUrl || null,
        userAgent: meta.userAgent || req.headers['user-agent'] || null,
        language: meta.language || null,
        screen: meta.screen || null,
        fingerprint: meta.fingerprint || null,
        ipAddress: req.ip || null,
        metaJson: meta ? JSON.stringify(meta) : null,
      })

      res.json({ ok: true, session })
    } catch (err) {
      console.error('Error creando sesión de chat:', err)
      res.status(500).json({ ok: false, error: 'Error creando sesión de chat' })
    }
  })

  // -----------------------------
  // Actualizar datos de contacto
  // -----------------------------
  router.patch('/session/:id/contact', async (req, res) => {
    try {
      const { id } = req.params
      const { name, email, phone, leadId } = req.body || {}

      const session = await ChatSession.findByPk(id)
      if (!session) {
        return res.status(404).json({ ok: false, error: 'Sesión no encontrada' })
      }

      if (name !== undefined) session.name = name
      if (email !== undefined) session.email = email
      if (phone !== undefined) session.phone = phone
      if (leadId !== undefined) session.leadId = leadId

      await session.save()

      res.json({ ok: true, session })
    } catch (err) {
      console.error('Error actualizando contacto de chat:', err)
      res
        .status(500)
        .json({ ok: false, error: 'Error actualizando contacto de chat' })
    }
  })

  // -----------------------------
  // Guardar mensaje (HTTP) + emitir por WS
  // -----------------------------
  router.post('/message', async (req, res) => {
    try {
      const { sessionId, text, sender = 'user', meta = null } = req.body || {}

      if (!sessionId || !text) {
        return res
          .status(400)
          .json({ ok: false, error: 'sessionId y text son obligatorios' })
      }

      const session = await ChatSession.findByPk(sessionId)
      if (!session) {
        return res.status(404).json({ ok: false, error: 'Sesión no encontrada' })
      }

      const message = await ChatMessage.create({
        sessionId,
        sender,
        text,
        metaJson: meta ? JSON.stringify(meta) : null,
      })

      // Actualizamos actividad de la sesión
      session.lastActivityAt = new Date()
      await session.save()

      // 🔔 Broadcast tiempo real por WebSocket
      try {
        if (io) {
          const room = String(sessionId)
          io.to(room).emit('chatMessage', {
            sessionId: room,
            id: message.id,
            from: sender,        // el front usa "from"
            message: text,       // y "message"
            createdAt: message.createdAt || new Date().toISOString(),
          })
        }
      } catch (wsErr) {
        console.error('Error emitiendo mensaje por WS:', wsErr)
        // no rompemos la respuesta HTTP por esto
      }

      res.json({ ok: true, message })
    } catch (err) {
      console.error('Error guardando mensaje de chat:', err)
      res
        .status(500)
        .json({ ok: false, error: 'Error guardando mensaje de chat' })
    }
  })

  // -----------------------------
  // Listar sesiones (para el CRM)
  // -----------------------------
  router.get('/sessions', async (req, res) => {
    try {
      const sessions = await ChatSession.findAll({
        // usamos updatedAt, que siempre existe
        order: [['updatedAt', 'DESC']],
      })
      res.json({ ok: true, sessions })
    } catch (err) {
      console.error('Error listando sesiones de chat:', err)
      res.status(500).json({ ok: false, error: 'Error listando sesiones' })
    }
  })

  // -----------------------------
  // Traer mensajes de una sesión
  // -----------------------------
  router.get('/sessions/:id/messages', async (req, res) => {
    try {
      const { id } = req.params

      const session = await ChatSession.findByPk(id)
      if (!session) {
        return res.status(404).json({ ok: false, error: 'Sesión no encontrada' })
      }

      const messages = await ChatMessage.findAll({
        where: { sessionId: id },
        order: [['createdAt', 'ASC']],
      })

      res.json({ ok: true, session, messages })
    } catch (err) {
      console.error('Error obteniendo mensajes de chat:', err)
      res
        .status(500)
        .json({ ok: false, error: 'Error obteniendo mensajes de la sesión' })
    }
  })

  return router
}

module.exports = createChatRoutes
