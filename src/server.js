// src/server.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { testConnection, sequelize } = require('./config/db')
const leadRoutes = require('./router/leadRoutes')

const app = express()

app.use(
  cors({
    origin: [
      'https://grupoalade.com',
      'https://www.grupoalade.com',
      'https://solar-calculator.cingulado.org',
      'https://aladeapp.cingulado.org',      // 👉 NUEVO: panel Vue en producción
      'http://localhost:5173',               // 👉 panel en dev (Vite)
      'http://localhost:3000',               // 👉 otra opción dev
      // 'https://TU-DOMINIO-DEL-PANEL',     // 👉 cuando lo tengas en producción, lo sumás acá si cambia
    ],
  })
)

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API Solar Calculator funcionando' })
})

app.use('/api/leads', leadRoutes)

const PORT = process.env.PORT || 4000

async function start() {
  await testConnection()
  await sequelize.sync({ alter: true })
  console.log('[DB] Migraciones sincronizadas')

  app.listen(PORT, () => {
    console.log(`[API] Escuchando en puerto ${PORT}`)
  })
}

start().catch(err => {
  console.error('[API] Error al iniciar el servidor:', err)
  process.exit(1)
})
