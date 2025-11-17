// src/models/index.js
const Lead = require('./Lead')
const ChatSession = require('./ChatSession')
const ChatMessage = require('./ChatMessage')

// =======================
// Relaciones
// =======================

// Lead → ChatSession (un lead puede tener muchos chats)
Lead.hasMany(ChatSession, {
  foreignKey: 'leadId',
  as: 'chatSessions',
})
ChatSession.belongsTo(Lead, {
  foreignKey: 'leadId',
  as: 'lead',
})

// ChatSession ↔ ChatMessage (una sesión tiene muchos mensajes)
ChatSession.hasMany(ChatMessage, {
  foreignKey: 'sessionId',
  as: 'messages',
})
ChatMessage.belongsTo(ChatSession, {
  foreignKey: 'sessionId',
  as: 'session',
})

module.exports = {
  Lead,
  ChatSession,
  ChatMessage,
}
