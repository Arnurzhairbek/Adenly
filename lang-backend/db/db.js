// lang-backend/db/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  client_encoding: 'UTF8', // Явно указываем UTF-8 кодировку
});

// Обработка ошибок подключения
pool.on('error', (err) => {
  console.error('❌ Неожиданная ошибка на клиенте PostgreSQL:', err);
});

module.exports = pool;
