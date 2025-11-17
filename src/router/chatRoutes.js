// src/router/chatRoutes.js
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const router = express.Router()

const { ChatSession, ChatMessage, ChatEvent } = require('../models')

// Helper para serializar meta
function safeJson(obj) {
  if (!obj) return null
  try {
    return JSON.stringify(obj)
  } catch (e) {
    return null
  }
}

/**
 * Crear nueva sesión de chat
 * Body:
 *  - meta: { sourceUrl, fingerprint, userAgent, language, screen, ipAddress? }
 *  - contact: { name, email, phone }
 */
router.post('/session', async (req, res) => {
  try {
    const { meta = {}, contact = {} } = req.body || {}

    const now = new Date()

    const session = await ChatSession.create({
      // datos de contacto
      name: contact.name || contact.fullName || null,
      email: contact.email || null,
      phone: contact.phone || null,

      status: 'open',
      startedAt: now,
      lastActivityAt: now,

      // metadatos
      sourceUrl: meta.sourceUrl || null,
      userAgent: meta.userAgent || null,
      language: meta.language || null,
      screen: meta.screen || null,
      fingerprint: meta.fingerprint || null,
      ipAddress: meta.ipAddress || req.ip || null,

      metaJson: safeJson(meta),
    })

    // evento opcional
    if (ChatEvent) {
      await ChatEvent.create({
        sessionId: session.id,
        eventType: 'session_open',
        eventData: safeJson({ meta, contact }),
      })
    }

    res.json({ ok: true, session })
  } catch (err) {
    console.error('[chat] Error creando sesión:', err)
    res.status(500).json({ ok: false, error: 'Error creando sesión de chat' })
  }
})

/**
 * Guardar mensaje de chat
 * Body:
 *  - sessionId
 *  - text
 *  - sender: 'user' | 'bot' | 'agent' | 'system'
 *  - meta
 */
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
      text,
      sender,
      metaJson: safeJson(meta),
    })

    // actualizar última actividad
    session.lastActivityAt = new Date()
    await session.save()

    // evento opcional
    if (ChatEvent) {
      await ChatEvent.create({
        sessionId,
        eventType: sender === 'user' ? 'message_user' : `message_${sender}`,
        eventData: safeJson(meta),
      })
    }

    res.json({ ok: true, message })
  } catch (err) {
    console.error('[chat] Error guardando mensaje:', err)
    res.status(500).json({ ok: false, error: 'Error guardando mensaje' })
  }
})

/**
 * Listar sesiones de chat (para CRM)
 * Query params:
 *  - status: open | closed (opcional)
 *  - limit, offset (opcionales)
 */
router.get('/sessions', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query

    const where = {}
    if (status) where.status = status

    const sessions = await ChatSession.findAll({
      where,
      order: [['lastActivityAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
    })

    res.json({ ok: true, sessions })
  } catch (err) {
    console.error('[chat] Error listando sesiones:', err)
    res.status(500).json({ ok: false, error: 'Error listando sesiones de chat' })
  }
})

/**
 * Obtener datos de una sesión (sin mensajes)
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params
    const session = await ChatSession.findByPk(id)

    if (!session) {
      return res.status(404).json({ ok: false, error: 'Sesión no encontrada' })
    }

    res.json({ ok: true, session })
  } catch (err) {
    console.error('[chat] Error obteniendo sesión:', err)
    res.status(500).json({ ok: false, error: 'Error obteniendo sesión' })
  }
})

/**
 * Obtener sesión + mensajes (para vista de detalle en CRM)
 */
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
    console.error('[chat] Error obteniendo mensajes de sesión:', err)
    res
      .status(500)
      .json({ ok: false, error: 'Error obteniendo mensajes de la sesión' })
  }
})

module.exports = router
