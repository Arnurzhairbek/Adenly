// routes/progress.js
const express = require("express");
const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const checkOwnership = require("../middleware/checkOwnership");
const { validateProgress, validateUserId } = require("../middleware/validateInput");
const pagination = require("../middleware/pagination");
const logger = require("../utils/logger");
const router = express.Router();

// 📊 Получить прогресс пользователя по всем курсам
router.get("/user/:user_id", authMiddleware, checkOwnership, validateUserId, pagination, async (req, res) => {
  const { user_id } = req.params;
  const { limit, offset } = req.pagination;
  
  try {
    // Если course_id есть, используем его, иначе получаем из lessons
    const result = await pool.query(
      `SELECT 
        p.*, 
        COALESCE(c.title, c2.title) AS course_title, 
        l.title AS lesson_title,
        COALESCE(p.course_id, l.course_id) AS course_id
       FROM progress p
       JOIN lessons l ON p.lesson_id = l.id
       LEFT JOIN courses c ON p.course_id = c.id
       LEFT JOIN courses c2 ON l.course_id = c2.id
       WHERE p.user_id = $1
       ORDER BY p.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [user_id, limit, offset]
    );
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM progress WHERE user_id = $1',
      [user_id]
    );
    const total = parseInt(countResult.rows[0].count);
    
    res.paginatedResponse(result.rows, total);
  } catch (err) {
    logger.error("Ошибка получения прогресса", { user_id, error: err });
    res.status(500).json({ message: "Ошибка сервера", error: err.message });
  }
});

// ➕ Добавить или обновить прогресс
router.post("/", authMiddleware, validateProgress, async (req, res) => {
  // Используем ID авторизованного пользователя вместо req.body.user_id
  const user_id = req.user.id;
  const { course_id, lesson_id, completed } = req.body;

  try {
    // Если course_id не передан, получаем его из lesson
    let finalCourseId = course_id;
    if (!finalCourseId && lesson_id) {
      const lessonRes = await pool.query(
        "SELECT course_id FROM lessons WHERE id = $1",
        [lesson_id]
      );
      if (lessonRes.rows.length > 0) {
        finalCourseId = lessonRes.rows[0].course_id;
      }
    }

    // Проверяем, есть ли уникальное ограничение
    const hasConstraint = await pool.query(`
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'progress_user_id_lesson_id_key'
    `);

    let query, params;
    if (hasConstraint.rows.length > 0) {
      // Если есть уникальное ограничение, используем ON CONFLICT
      query = `INSERT INTO progress (user_id, course_id, lesson_id, completed)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (user_id, lesson_id)
               DO UPDATE SET completed = EXCLUDED.completed, 
                             course_id = EXCLUDED.course_id,
                             updated_at = CURRENT_TIMESTAMP
               RETURNING *`;
      params = [user_id, finalCourseId, lesson_id, completed || false];
    } else {
      // Если нет ограничения, сначала удаляем старую запись, потом вставляем новую
      await pool.query(
        "DELETE FROM progress WHERE user_id = $1 AND lesson_id = $2",
        [user_id, lesson_id]
      );
      query = `INSERT INTO progress (user_id, course_id, lesson_id, completed)
               VALUES ($1, $2, $3, $4)
               RETURNING *`;
      params = [user_id, finalCourseId, lesson_id, completed || false];
    }

    const result = await pool.query(query, params);
    logger.info("Прогресс обновлен", { user_id, lesson_id });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error("Ошибка добавления прогресса", { user_id, error: err });
    res.status(500).json({ message: "Ошибка сервера", error: err.message });
  }
});

// 🔄 Получить прогресс по конкретному курсу
router.get("/user/:user_id/course/:course_id", authMiddleware, checkOwnership, validateUserId, async (req, res) => {
  const { user_id, course_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.*, l.title AS lesson_title
       FROM progress p
       JOIN lessons l ON p.lesson_id = l.id
       WHERE p.user_id=$1 AND (p.course_id=$2 OR l.course_id=$2)`,
      [user_id, course_id]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error("Ошибка получения прогресса курса", { user_id, course_id, error: err });
    res.status(500).json({ message: "Ошибка сервера", error: err.message });
  }
});

module.exports = router;
