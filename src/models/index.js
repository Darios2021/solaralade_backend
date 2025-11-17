// src/models/index.js
const Lead = require('./Lead')
const ChatSession = require('./ChatSession')
const ChatMessage = require('./ChatMessage')
const ChatEvent = require('./ChatEvent')

// Lead → ChatSession (a futuro, si querés vincular)
Lead.hasMany(ChatSession, {
  foreignKey: 'leadId',
  as: 'chatSessions',
})
ChatSession.belongsTo(Lead, {
  foreignKey: 'leadId',
  as: 'lead',
})

// ChatSession ↔ ChatMessage
ChatSession.hasMany(ChatMessage, {
  foreignKey: 'sessionId',
  as: 'messages',
})
ChatMessage.belongsTo(ChatSession, {
  foreignKey: 'sessionId',
  as: 'session',
})

// ChatSession ↔ ChatEvent
ChatSession.hasMany(ChatEvent, {
  foreignKey: 'sessionId',
  as: 'events',
})
ChatEvent.belongsTo(ChatSession, {
  foreignKey: 'sessionId',
  as: 'session',
})

module.exports = {
  Lead,
  ChatSession,
  ChatMessage,
  ChatEvent,
}
