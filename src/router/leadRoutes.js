const express = require('express')
const Lead = require('../models/Lead')

const router = express.Router()

router.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Leads API OK' })
})

router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      city,
      province,
      country,
      systemPurpose,
      usageType,
      averageBill,
      notes,
    } = req.body

    if (!firstName || !email || !phone) {
      return res.status(400).json({
        ok: false,
        message: 'Nombre, email y teléfono son obligatorios',
      })
    }

    const lead = await Lead.create({
      firstName,
      lastName,
      email,
      phone,
      city,
      province,
      country,
      systemPurpose,
      usageType,
      averageBill,
      notes,
    })

    res.status(201).json({
      ok: true,
      message: 'Lead creado correctamente',
      data: { id: lead.id },
    })
  } catch (err) {
    console.error('[API] Error al crear lead:', err)
    res.status(500).json({
      ok: false,
      message: 'Error interno al crear el lead',
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id)
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead no encontrado' })
    }
    res.json({ ok: true, data: lead })
  } catch (err) {
    console.error('[API] Error al obtener lead:', err)
    res.status(500).json({ ok: false, message: 'Error interno' })
  }
})

module.exports = router
