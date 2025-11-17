// src/models/index.js
const Lead = require('./Lead')
const ChatSession = require('./ChatSession')
const ChatMessage = require('./ChatMessage')
const ChatEvent = require('./ChatEvent')

// ⚠️ Importante:
// De momento NO definimos asociaciones hasMany/belongsTo
// para evitar el error de "hasMany called with something that's not a subclass...".
// Los endpoints de chat trabajan con sessionId directamente, así que
// podemos operar sin asociaciones hasta estabilizar el modelo.

module.exports = {
  Lead,
  ChatSession,
  ChatMessage,
  ChatEvent,
}
