const { DataTypes } = require('sequelize')
const sequelize = require('../config/db').sequelize

const ChatMessage = sequelize.define('ChatMessage', {
  sender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true,
  },
})

module.exports = ChatMessage
