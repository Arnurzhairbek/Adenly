const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const authMiddleware = require('../middleware/authMiddleware');

// 📊 Получить таблицу лидеров
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id AS user_id,
        COALESCE(u.name, u.email) AS username,
        COUNT(DISTINCT p.lesson_id) AS completed_lessons
      FROM users u
      LEFT JOIN progress p ON u.id = p.user_id 
        AND (
          p.completed = true 
          OR p.status = 'completed' 
          OR p.status = 'done'
        )
      GROUP BY u.id, u.name, u.email
      ORDER BY completed_lessons DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении таблицы лидеров', error: err.message });
  }
});

module.exports = router;
