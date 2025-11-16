// src/models/SolarLead.js
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const SolarLead = sequelize.define(
  'SolarLead',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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

    // --- Proyecto ---
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
    segment: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
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

    // --- Contacto ---
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // --- Meta / tracking ---
    sourceUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sourceTag: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    rawMetaJson: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'solar_leads',
    timestamps: true, // createdAt y updatedAt
  }
)

module.exports = SolarLead
