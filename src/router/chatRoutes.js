// src/router/chatRoutes.js
const express = require('express')
const router = express.Router()
const { ChatSession, ChatMessage } = require('../models')

// Helper para serializar / parsear meta
function safeJson (obj) {
  if (!obj) return null
  try {
    return JSON.stringify(obj)
  } catch (e) {
    return null
  }
}

function safeParse (str) {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}

// =======================================
//  CREAR SESIÓN
// =======================================
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

      sourceUrl: meta.sourceUrl || meta.url || null,
      userAgent: meta.userAgent || req.headers['user-agent'] || null,
      language: meta.language || null,
      screen: meta.screen ? JSON.stringify(meta.screen) : null,
      fingerprint: meta.fingerprint || null,
      ipAddress: req.ip || null,
      metaJson: safeJson(meta),
    })

    res.json({ ok: true, session })
  } catch (err) {
    console.error('Error creando sesión de chat:', err)
    res.status(500).json({ ok: false, error: 'Error creando sesión de chat' })
  }
})

// =======================================
//  ACTUALIZAR CONTACTO
// =======================================
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

// =======================================
//  GUARDAR MENSAJE
// =======================================
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
      metaJson: safeJson(meta),
    })

    session.lastActivityAt = new Date()
    await session.save()

    res.json({ ok: true, message })
  } catch (err) {
    console.error('Error guardando mensaje de chat:', err)
    res.status(500).json({ ok: false, error: 'Error guardando mensaje de chat' })
  }
})

// =======================================
//  LISTAR SESIONES (para el CRM)
// =======================================
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await ChatSession.findAll({
      order: [['updatedAt', 'DESC']],
    })

    // Opcional: adaptar un poco el shape que ve el front
    const result = sessions.map(s => ({
      id: s.id,
      status: s.status,
      name: s.name,
      email: s.email,
      phone: s.phone,
      sourceUrl: s.sourceUrl,
      lastActivityAt: s.lastActivityAt || s.updatedAt,
      meta: safeParse(s.metaJson),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))

    res.json({ ok: true, sessions: result })
  } catch (err) {
    console.error('Error listando sesiones de chat:', err)
    res.status(500).json({ ok: false, error: 'Error listando sesiones' })
  }
})

// =======================================
//  TRAER MENSAJES DE UNA SESIÓN
// =======================================
router.get('/sessions/:id/messages', async (req, res) => {
  try {
    const id = Number(req.params.id)

    const session = await ChatSession.findByPk(id)
    if (!session) {
      return res.status(404).json({ ok: false, error: 'Sesión no encontrada' })
    }

    const messages = await ChatMessage.findAll({
      where: { sessionId: id },
      order: [['createdAt', 'ASC']],
    })

    const result = messages.map(m => ({
      id: m.id,
      sessionId: m.sessionId,
      sender: m.sender,
      text: m.text,
      meta: safeParse(m.metaJson),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }))

    res.json({
      ok: true,
      session: {
        id: session.id,
        status: session.status,
        name: session.name,
        email: session.email,
        phone: session.phone,
      },
      messages: result,
    })
  } catch (err) {
    console.error('Error obteniendo mensajes de chat:', err)
    res
      .status(500)
      .json({ ok: false, error: 'Error obteniendo mensajes de la sesión' })
  }
})

module.exports = router
