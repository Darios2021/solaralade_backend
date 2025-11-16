// src/router/leadRoutes.js
const express = require('express')
const { Op } = require('sequelize')
const { Lead } = require('../models')

const router = express.Router()

// ----------------- Crear lead desde el simulador -----------------
router.post('/solar', async (req, res) => {
  try {
    const body = req.body || {}

    // Desestructuramos con defaults seguros
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

// ----------------- Listar leads (para panel admin) -----------------
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100)
    const search = (req.query.search || '').trim()

    const offset = (page - 1) * limit

    const where = {}

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ]
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
})

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

module.exports = router
