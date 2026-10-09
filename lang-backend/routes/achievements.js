// routes/achievements.js
const express = require("express");
const pool = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");
const checkOwnership = require("../middleware/checkOwnership");
const { validateAchievements, validateUserId } = require("../middleware/validateInput");
const logger = require("../utils/logger");
const router = express.Router();

// 📈 Получить достижения пользователя
router.get("/:user_id", authMiddleware, checkOwnership, validateUserId, async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM achievements WHERE user_id = $1",
      [user_id]
    );

    // Если нет записей, создаём их
    if (result.rows.length === 0) {
      const newUser = await pool.query(
        `INSERT INTO achievements (user_id) VALUES ($1) RETURNING *`,
        [user_id]
      );
      logger.info("Создана запись достижений для пользователя", { user_id });
      return res.status(201).json(newUser.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error("Ошибка при получении достижений", { user_id, error: err });
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// 🏆 Добавить XP и обновить уровень
router.post("/add-xp", authMiddleware, validateAchievements, checkOwnership, async (req, res) => {
  const { user_id, xp_to_add } = req.body;
  try {
    const result = await pool.query(
      `UPDATE achievements
       SET xp = xp + $1,
           level = level + FLOOR((xp + $1) / 1000) - FLOOR(xp / 1000),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING *`,
      [xp_to_add, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Пользователь не найден в achievements" });
    }

    logger.info("XP добавлен пользователю", { user_id, xp_to_add });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error("Ошибка при добавлении XP", { user_id, error: err });
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// ✅ Увеличить количество завершённых уроков
router.post("/complete-lesson", authMiddleware, validateAchievements, checkOwnership, async (req, res) => {
  const { user_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE achievements
       SET lessons_completed = lessons_completed + 1,
           xp = xp + 50,
           level = level + FLOOR((xp + 50) / 1000) - FLOOR(xp / 1000),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [user_id]
    );
    
    if (result.rows.length === 0) {
      // Создаем запись если её нет
      const newUser = await pool.query(
        `INSERT INTO achievements (user_id, lessons_completed, xp, level) 
         VALUES ($1, 1, 50, 1) 
         RETURNING *`,
        [user_id]
      );
      logger.info("Урок завершен, создана запись достижений", { user_id });
      return res.json(newUser.rows[0]);
    }
    
    logger.info("Урок завершен", { user_id });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error("Ошибка при обновлении уроков", { user_id, error: err });
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
