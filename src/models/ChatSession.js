const { DataTypes } = require('sequelize')
const sequelize = require('../config/db').sequelize

const ChatSession = sequelize.define('ChatSession', {
  // id, createdAt y updatedAt los agrega Sequelize por defecto

  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active', // podés usar 'open' si te gusta más
  },

  // JSON con info de contexto del chat (url, device, etc.)
  meta: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  // JSON con datos de contacto (nombre, email, phone, etc.)
  contact: {
    type: DataTypes.JSON,
    allowNull: true,
  },
})

module.exports = ChatSession
