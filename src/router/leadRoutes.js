// src/router/leadRoutes.js
const express = require('express')
const { Op } = require('sequelize')
const { Lead } = require('../models')

const router = express.Router()

// Campos CRM que se pueden editar desde el panel
const EDITABLE_CRM_FIELDS = [
  'priority',
  'crmStatus',
  'assignedTo',
  'internalNotes',
  'lastContactAt',
  'nextActionAt',
]

// ----------------- Crear lead desde el simulador -----------------
router.post('/solar', async (req, res) => {
  try {
    const body = req.body || {}

    const location = body.location || {}
    const project = body.project || {}
    const contact = body.contact || {}
    const meta = body.meta || {}

    const lead = await Lead.create({
      // Ubicación
      city: location.city ?? null,
      provinceCode: location.provinceCode ?? null,
      provinceName: location.provinceName ?? null,
      countryCode: location.countryCode ?? null,
      countryName: location.countryName ?? null,

      // Proyecto
      purposeCode: project.purposeCode ?? null,
      purposeLabel: project.purposeLabel ?? null,
      purposeDriver: project.purposeDriver ?? null,
      usageCode: project.usageCode ?? null,
      usageLabel: project.usageLabel ?? null,
      segment: project.segment ?? null,
      monthlyBillArs: project.monthlyBillArs ?? null,
      estimatedMonthlyKwh: project.estimatedMonthlyKwh ?? null,
      estimatedSystemSizeKw: project.estimatedSystemSizeKw ?? null,
      priority: project.priority ?? null,

      // Contacto
      fullName: contact.fullName ?? null,
      phone: contact.phone ?? null,
      email: contact.email ?? null,

      // Meta
      sourceUrl: meta.sourceUrl ?? null,
      sourceTag: meta.sourceTag ?? null,
      rawMetaJson: JSON.stringify(meta || {}),

      // CRM inicial
      crmStatus: 'nuevo',
      assignedTo: null,
      internalNotes: null,
      lastContactAt: null,
      nextActionAt: null,
    })

    return res.json({
      ok: true,
      message: 'Lead creado correctamente',
      lead,
    })
  } catch (err) {
    console.error('[leads] Error al crear lead:', err)
    return res.status(500).json({
      ok: false,
      message: 'Error al registrar el lead',
      error: err.message,
    })
  }
})

// ----------------- Helper: listar leads -----------------
async function listarLeads(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100)
    const search = (req.query.search || '').trim()

    const offset = (page - 1) * limit
    const where = {}

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { provinceName: { [Op.like]: `%${search}%` } },
      ]
    }

    // Filtros CRM opcionales
    if (req.query.crmStatus) {
      where.crmStatus = req.query.crmStatus
    }
    if (req.query.assignedTo) {
      where.assignedTo = req.query.assignedTo
    }

    const { count, rows } = await Lead.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    })

    return res.json({
      ok: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    })
  } catch (err) {
    console.error('[leads] Error al listar leads:', err)
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener leads',
      error: err.message,
    })
  }
}

// Listar leads (admin / panel)
router.get('/', listarLeads)

// Alias /solar por compatibilidad
router.get('/solar', listarLeads)

// ----------------- Obtener lead por ID -----------------
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!id) {
      return res.status(400).json({
        ok: false,
        message: 'ID inválido',
      })
    }

    const lead = await Lead.findByPk(id)

    if (!lead) {
      return res.status(404).json({
        ok: false,
        message: 'Lead no encontrado',
      })
    }

    return res.json({
      ok: true,
      data: lead,
    })
  } catch (err) {
    console.error('[leads] Error al obtener lead por ID:', err)
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener el lead',
      error: err.message,
    })
  }
})

// ----------------- Actualizar datos CRM del lead -----------------
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!id) {
      return res.status(400).json({
        ok: false,
        message: 'ID inválido',
      })
    }

    const lead = await Lead.findByPk(id)
    if (!lead) {
      return res.status(404).json({
        ok: false,
        message: 'Lead no encontrado',
      })
    }

    const body = req.body || {}

    // Solo actualizamos campos permitidos
    for (const field of EDITABLE_CRM_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        lead[field] = body[field]
      }
    }

    await lead.save()

    return res.json({
      ok: true,
      message: 'Lead actualizado correctamente',
      data: lead,
    })
  } catch (err) {
    console.error('[leads] Error al actualizar lead:', err)
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar el lead',
      error: err.message,
    })
  }
})

module.exports = router
