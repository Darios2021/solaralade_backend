// src/router/chatRoutes.js
const express = require('express')
const router = express.Router()
const { ChatSession, ChatMessage } = require('../models')
const { getIo } = require('../socketHub')

// Crear sesión
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

// Actualizar contacto
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
    res.status(500).json({ ok: false, error: 'Error actualizando contacto de chat' })
  }
})

// ===============================
// GUARDAR MENSAJE + BROADCAST WS
// ===============================
router.post('/message', async (req, res) => {
  try {
    const { sessionId, text, sender = 'user', meta = null } = req.body || {}

    if (!sessionId || !text) {
      return res.status(400).json({ ok: false, error: 'sessionId y text son obligatorios' })
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

    session.lastActivityAt = new Date()
    await session.save()

    // 🔥 ENVIAR MENSAJE EN TIEMPO REAL
    const io = getIo()
    if (io) {
      io.to(String(sessionId)).emit('chatMessage', {
        sessionId,
        from: sender,
        message: text,
        id: message.id,
        createdAt: message.createdAt,
      })
    }

    res.json({ ok: true, message })
  } catch (err) {
    console.error('Error guardando mensaje de chat:', err)
    res.status(500).json({ ok: false, error: 'Error guardando mensaje de chat' })
  }
})

// Listar sesiones
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await ChatSession.findAll({
      order: [['updatedAt', 'DESC']],
    })
    res.json({ ok: true, sessions })
  } catch (err) {
    console.error('Error listando sesiones de chat:', err)
    res.status(500).json({ ok: false, error: 'Error listando sesiones' })
  }
})

// Listar mensajes
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
    res.status(500).json({ ok: false, error: 'Error obteniendo mensajes' })
  }
})

module.exports = router
