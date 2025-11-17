// src/models/Lead.js
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Lead = sequelize.define(
  'Lead',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    // --- Contacto básico (email/phone primero para búsquedas rápidas) ---
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // --- Ubicación ---
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    provinceCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    provinceName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    countryCode: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    countryName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // --- Proyecto / motivación ---
    purposeCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    purposeLabel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    purposeDriver: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    usageCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    usageLabel: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Segmento general (ej: residencial, comercial, industrial)
    segment: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Tipo de propiedad según el formulario (Mi casa, Mi empresa, Campo, etc.)
    propertyType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // --- Datos económicos / técnicos básicos ---
    monthlyBillArs: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    estimatedMonthlyKwh: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    estimatedSystemSizeKw: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    priority: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // --- Contacto extendido ---
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // --- Origen / tracking digital ---
    sourceUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sourceTag: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Aquí guardamos TODO el JSON con meta de frontend + servidor
    rawMetaJson: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // ==========================
    //   CAMPOS CRM EVOLUCIONADOS
    // ==========================

    // Estado del lead en el funnel: nuevo, contactado, en_propuesta, ganado, perdido, etc.
    crmStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Puntuación 0–100 segun qué tan “hot” es el lead
    crmScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },

    // Responsable / comercial asignado
    assignedTo: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Último contacto efectivo
    lastContactAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Próxima acción / recordatorio
    nextActionAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Tipo de próxima acción (llamada, mail, visita, reunión, etc.)
    nextActionType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Notas internas del CRM
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Tags simples separados por comas (ej: hogar, campo, 10kW, alta_factura)
    tags: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    // ==========================
    //   RESULTADOS DEL CÁLCULO SOLAR
    // ==========================

    // Cantidad estimada de paneles
    estimatedPanels: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Potencia del inversor recomendada (kW)
    estimatedInverterKw: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },

    // Generación anual estimada (kWh/año)
    estimatedYearlyKwh: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Ahorro anual estimado en ARS
    estimatedYearlySavingsArs: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },

    // Años de repago estimado de la inversión
    paybackYears: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
  },
  {
    tableName: 'solar_leads',
    timestamps: true, // createdAt y updatedAt
  }
)

module.exports = Lead
