const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  }
)

async function testConnection() {
  try {
    await sequelize.authenticate()
    console.log('[DB] Conexión a MySQL OK')
  } catch (err) {
    console.error('[DB] Error al conectar a MySQL:', err)
    throw err
  }
}

module.exports = { sequelize, testConnection }
