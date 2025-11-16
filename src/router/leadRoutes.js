// src/router/leadRoutes.js
const express = require('express');
const router = express.Router();
const { SolarLead } = require('../models');

// Handler compartido para crear el lead
async function createLead(req, res) {
  try {
    const { location = {}, project = {}, contact = {}, meta = {} } = req.body || {};

    const leadToCreate = {
      // Ubicación
      city: location.city || null,
      provinceCode: location.provinceCode || null,
      provinceName: location.provinceName || null,
      countryCode: location.countryCode || null,
      countryName: location.countryName || null,

      // Proyecto
      purposeCode: project.purposeCode || null,
      purposeLabel: project.purposeLabel || null,
      purposeDriver: project.purposeDriver || null,
      usageCode: project.usageCode || null,
      usageLabel: project.usageLabel || null,
      segment: project.segment || null,
      monthlyBillArs: project.monthlyBillArs ?? null,
      estimatedMonthlyKwh: project.estimatedMonthlyKwh ?? null,
      estimatedSystemSizeKw: project.estimatedSystemSizeKw ?? null,
      priority: project.priority || null,

      // Contacto
      fullName: contact.fullName || null,
      phone: contact.phone || null,
      email: contact.email || null,

      // Meta
      sourceUrl: meta.sourceUrl || null,
      sourceTag: meta.sourceTag || null,
      rawMetaJson: JSON.stringify(meta || {}),
    };

    const lead = await SolarLead.create(leadToCreate);

    return res.status(201).json({
      ok: true,
      message: 'Lead creado correctamente',
      lead,
    });
  } catch (err) {
    console.error('[leadRoutes] Error al crear lead:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al registrar el lead',
      error: err.message || 'Internal server error',
    });
  }
}

// Acepta POST /api/leads
router.post('/', createLead);

// Acepta POST /api/leads/solar (para lo que ya está usando el frontend)
router.post('/solar', createLead);

module.exports = router;
