const { DataTypes } = require('sequelize')
const sequelize = require('../config/db').sequelize

const ChatSession = sequelize.define('ChatSession', {
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  contact: {
    type: DataTypes.JSON,
    allowNull: true,
  },
})

module.exports = ChatSession
