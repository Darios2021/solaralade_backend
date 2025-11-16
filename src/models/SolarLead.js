const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Lead = sequelize.define(
  'Lead',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    // Datos personales
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    // Ubicación
    city: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    province: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(120),
      allowNull: true,
      defaultValue: 'Argentina',
    },

    // Info del proyecto
    systemPurpose: {
      // ¿Para qué querés un sistema solar?
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    usageType: {
      // Esto es para: casa, comercio, empresa, etc.
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    averageBill: {
      // factura promedio estimada (opcional)
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Gestión comercial
    source: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'web-grupoalade',
    },
    status: {
      type: DataTypes.ENUM(
        'nuevo',
        'contactado',
        'en_proceso',
        'cerrado',
        'descartado'
      ),
      allowNull: false,
      defaultValue: 'nuevo',
    },
  },
  {
    tableName: 'solar_leads',
  }
)

module.exports = Lead
