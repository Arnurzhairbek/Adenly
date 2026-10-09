const express = require("express");
const pool = require("../db/db");
const logger = require("../utils/logger");
const authMiddleware = require("../middleware/authMiddleware");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const router = express.Router();

// Отправка сообщения обратной связи
router.post("/", async (req, res) => {
  const { name, email, subject, message, category } = req.body;
  const authHeader = req.headers.authorization;
  
  let userId = null;
  
  // Если пользователь авторизован, получаем его ID
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // Игнорируем ошибку токена, пользователь может быть не авторизован
    }
  }

  // Валидация
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "Барлық өрістерді толтырыңыз" });
  }

  if (message.length < 10) {
    return res.status(400).json({ message: "Хабарлама кемінде 10 таңба болуы керек" });
  }

  // Проверка формата email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Email форматы дұрыс емес" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO feedback (user_id, name, email, subject, message, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [userId, name, email, subject, message, category || "general"]
    );

    logger.info("Сообщение обратной связи сохранено", { 
      feedbackId: result.rows[0].id, 
      userId,
      email 
    });

    res.status(201).json({
      message: "Пікіріңіз сәтті жіберілді! Рахмет!",
      id: result.rows[0].id
    });
  } catch (err) {
    logger.error("Ошибка сохранения обратной связи", { error: err });
    res.status(500).json({ message: "Сервер қатесі. Кейінірек қайталаңыз." });
  }
});

// Получение всех сообщений (только для админов)
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Проверяем, что пользователь - админ
    const userRes = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [req.user.id]
    );
    
    if (userRes.rows.length === 0 || userRes.rows[0].role !== "admin") {
      return res.status(403).json({ message: "Тек админдерге рұқсат етілген" });
    }

    const result = await pool.query(
      `SELECT f.*, u.email as user_email, u.name as user_name
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       ORDER BY f.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    logger.error("Ошибка получения обратной связи", { error: err });
    res.status(500).json({ message: "Сервер қатесі" });
  }
});

// Обновление статуса сообщения (только для админов)
router.patch("/:id/status", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Проверяем, что пользователь - админ
    const userRes = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [req.user.id]
    );
    
    if (userRes.rows.length === 0 || userRes.rows[0].role !== "admin") {
      return res.status(403).json({ message: "Тек админдерге рұқсат етілген" });
    }

    const result = await pool.query(
      `UPDATE feedback SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Хабарлама табылмады" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error("Ошибка обновления статуса обратной связи", { error: err });
    res.status(500).json({ message: "Сервер қатесі" });
  }
});

module.exports = router;

