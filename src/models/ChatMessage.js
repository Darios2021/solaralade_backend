// src/models/ChatMessage.js
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

// ⚠ IMPORTANTE:
// Este modelo define correctamente la columna sessionId
// y usa metaJson como TEXT para guardar JSON stringificado.
// sequelize.sync({ alter: true }) se encarga de actualizar la tabla.

const ChatMessage = sequelize.define(
  'ChatMessage',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    // 🔹 Relación con la sesión (OBLIGATORIO)
    sessionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    // 🔹 Quién envió el mensaje
    sender: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user', // user | agent | bot | system
    },

    // 🔹 Texto del mensaje
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // 🔹 Meta adicional del mensaje
    metaJson: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'ChatMessages', // coincide con tu tabla existente
    timestamps: true,          // necesario para ordenar por createdAt
  }
)

module.exports = ChatMessage
