const express = require('express');
const pool = require('../db/db');
const jwt = require('jsonwebtoken');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

// 🔹 Получить все уведомления текущего пользователя
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении уведомлений:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 🔹 Отметить уведомление как прочитанное
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    res.json({ message: 'Уведомление отмечено как прочитанное' });
  } catch (err) {
    console.error('Ошибка при обновлении уведомления:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 🔹 Создать уведомление (например, при достижении цели)
router.post('/', authMiddleware, async (req, res) => {
  const { message, type } = req.body;
  const user_id = req.user.id;
  if (typeof message !== "string" || !message.trim()) return res.status(400).json({ message: "Message is required" });

  try {
    await pool.query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [user_id, message, type || 'info']
    );
    res.status(201).json({ message: 'Уведомление создано' });
  } catch (err) {
    console.error('Ошибка при создании уведомления:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
