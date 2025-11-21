// src/models/ChatEvent.js
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

/**
 * ChatEvent:
 * Eventos del sistema dentro de una sesión de chat.
 * Ejemplos:
 *  - "sesión abierta"
 *  - "bot envió sugerencia"
 *  - "usuario dejó el chat"
 *  - "asignado a un agente"
 *
 * A futuro podés expandirlo sin romper nada.
 */

const ChatEvent = sequelize.define(
  'ChatEvent',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    sessionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'system',
    },

    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'ChatEvents',
    timestamps: true, // createdAt / updatedAt
  }
)

module.exports = ChatEvent
