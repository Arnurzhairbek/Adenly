// Скрипт для автоматического создания базы данных, если её нет
const { Pool } = require('pg');
require('dotenv').config();

async function createDatabaseIfNotExists() {
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Подключаемся к системной БД
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
  });

  const dbName = process.env.DB_NAME || 'langapp';

  try {
    // Проверяем, существует ли база данных
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // База данных не существует, создаём её
      console.log(`📦 Создание базы данных "${dbName}"...`);
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ База данных "${dbName}" успешно создана!`);
    } else {
      console.log(`✅ База данных "${dbName}" уже существует`);
    }
  } catch (err) {
    console.error(`❌ Ошибка при создании базы данных:`, err.message);
    throw err;
  } finally {
    await adminPool.end();
  }
}

// Если скрипт запущен напрямую
if (require.main === module) {
  createDatabaseIfNotExists()
    .then(() => {
      console.log('✅ Готово!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Ошибка:', err);
      process.exit(1);
    });
}

module.exports = createDatabaseIfNotExists;

