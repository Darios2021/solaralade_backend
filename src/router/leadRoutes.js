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

/**
 * Lookup de geolocalización por IP usando ip-api.com
 * Docs: http://ip-api.com/docs/api:json
 *
 * IMPORTANTE:
 * - Esto asume Node 18+ con fetch global disponible.
 *   Si tu runtime es más viejo, tenés que agregar un polyfill (node-fetch, etc.).
 */
async function lookupIpGeo (ip) {
  if (!ip) return null

  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(
      ip,
    )}?fields=status,country,countryCode,regionName,region,city,zip,lat,lon,isp,org,as,timezone,query`

    // Timeout corto para no trabar el endpoint si el servicio externo falla
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1200)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error('[leads] ip-api.com HTTP error:', res.status)
      return null
    }

    const data = await res.json()
    if (!data || data.status !== 'success') {
      return null
    }

    // Normalizamos a un objeto más prolijo
    return {
      ip: data.query || ip,
      country: data.country || null,
      countryCode: data.countryCode || null,
      region: data.regionName || null,
      regionCode: data.region || null,
      city: data.city || null,
      zip: data.zip || null,
      lat: data.lat ?? null,
      lon: data.lon ?? null,
      isp: data.isp || null,
      org: data.org || null,
      as: data.as || null,
      timezone: data.timezone || null,
    }
  } catch (err) {
    console.error('[leads] IP geo lookup error:', err.message || err)
    return null
  }
}

// ----------------- Crear lead desde el simulador -----------------
router.post('/solar', async (req, res) => {
  try {
    const body = req.body || {}

    const location = body.location || {}
    const project = body.project || {}
    const contact = body.contact || {}
    const metaFromClient = body.meta || {}

    // IP desde el header o el socket
    const ipHeader = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null
    const ip =
      typeof ipHeader === 'string'
        ? ipHeader.split(',')[0].trim()
        : ipHeader

    // Geo por IP (best effort: si falla, seguimos igual)
    const ipGeo = await lookupIpGeo(ip)

    // Meta adicional calculada en el servidor (IP, UA, Accept-Language, fecha, geo)
    const serverMeta = {
      ip: ip || null,
      userAgent: req.headers['user-agent'] || null,
      acceptLanguage: req.headers['accept-language'] || null,
      receivedAtIso: new Date().toISOString(),
      ipGeo: ipGeo || null,
    }

    // Meta final que guardamos en rawMetaJson
    const fullMeta = {
      ...metaFromClient,
      server: serverMeta,
    }

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
      propertyType: project.propertyType ?? null,

      monthlyBillArs: project.monthlyBillArs ?? null,
      estimatedMonthlyKwh: project.estimatedMonthlyKwh ?? null,
      estimatedSystemSizeKw: project.estimatedSystemSizeKw ?? null,
      priority: project.priority ?? null,

      // Resultados del cálculo solar (si llegan)
      estimatedPanels: project.estimatedPanels ?? null,
      estimatedInverterKw: project.estimatedInverterKw ?? null,
      estimatedYearlyKwh: project.estimatedYearlyKwh ?? null,
      estimatedYearlySavingsArs: project.estimatedYearlySavingsArs ?? null,
      paybackYears: project.paybackYears ?? null,

      // Contacto
      fullName: contact.fullName ?? null,
      phone: contact.phone ?? null,
      email: contact.email ?? null,

      // Meta / tracking digital
      sourceUrl: metaFromClient.sourceUrl ?? null,
      sourceTag: metaFromClient.sourceTag ?? null,
      rawMetaJson: JSON.stringify(fullMeta || {}),

      // CRM inicial (si vienen datos desde el simulador)
      crmStatus: (body.crm && body.crm.crmStatus) || 'nuevo',
      crmScore: (body.crm && body.crm.crmScore) ?? null,
      assignedTo: (body.crm && body.crm.assignedTo) ?? null,
      internalNotes: (body.crm && body.crm.internalNotes) ?? null,
      lastContactAt: (body.crm && body.crm.lastContactAt) ?? null,
      nextActionAt: (body.crm && body.crm.nextActionAt) ?? null,
      nextActionType: (body.crm && body.crm.nextActionType) ?? null,
      tags: (body.crm && body.crm.tags) ?? null,
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
async function listarLeads (req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 50, 1),
      100,
    )
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
