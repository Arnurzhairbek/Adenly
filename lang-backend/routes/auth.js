// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/db");
const { sendMail } = require("../utils/mailer");
const { validateRegister, validateLogin } = require("../middleware/validateInput");
const logger = require("../utils/logger");
require("dotenv").config();

const router = express.Router();

/* ============================
   ✅ Регистрация + подтверждение Email
============================ */
router.post("/register", validateRegister, async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    // Проверяем, есть ли пользователь
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Пользователь уже существует" });

    // Хешируем пароль
    const hashed = await bcrypt.hash(password, 10);

    // Создаём запись (ещё не подтверждён)
    const userRes = await pool.query(
      `INSERT INTO users (email, password, name, role, is_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name`,
      [email, hashed, name || "", role || "user", false]
    );
    const user = userRes.rows[0];

    // Токен подтверждения email
    const verifyToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Используем переменную окружения для frontend URL или localhost по умолчанию
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, ""); // Убираем trailing slash
    const verifyLink = `${frontendUrl}/verify-email/${verifyToken}`;
    
    // Отладка: выводим используемый URL
    logger.info("Email verification link generated", { 
      frontendUrl, 
      verifyLink,
      hasEnvVar: !!process.env.FRONTEND_URL 
    });

    // Отправляем письмо
    await sendMail(
      email,
      "Подтверждение регистрации в Adenly",
      "Подтвердите ваш email",
      `<h2>Сәлем, ${name || "пайдаланушы"}!</h2>
       <p>Сізді <b>Adenly</b>-ға тіркелгеніңіз үшін рахмет!</p>
       <p>Аккаунтыңызды іске қосу үшін сілтемені басыңыз:</p>
       <a href="${verifyLink}" style="display:inline-block; padding:12px 24px; background:#4F46E5; color:white; text-decoration:none; border-radius:8px; font-weight:bold; margin:10px 0;">Email-ді растау</a>
       <p>⚠️ Сілтеме 24 сағат бойы жарамды.</p>
       <p style="color:#666; font-size:12px; margin-top:20px;">Егер сіз тіркелмеген болсаңыз, бұл хабарламаны елемеңіз.</p>`
    );

    logger.info("Пользователь зарегистрирован", { email, userId: user.id });
    res.status(201).json({
      message: "✅ Аккаунт создан! Проверьте почту для подтверждения email."
    });
  } catch (err) {
    logger.error("Ошибка регистрации", { email, error: err });
    res.status(500).json({ message: "Ошибка сервера при регистрации" });
  }
});

/* ============================
   ✉️ Подтверждение Email
============================ */
router.get("/verify-email/:token", async (req, res) => {
  const { token } = req.params;
  
  // Проверяем наличие токена
  if (!token) {
    logger.error("Ошибка подтверждения email: токен отсутствует");
    return res.status(400).json({ message: "Растау токені табылмады" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.id]);
    
    if (userRes.rows.length === 0) {
      logger.error("Ошибка подтверждения email: пользователь не найден", { userId: decoded.id });
      return res.status(404).json({ message: "Пайдаланушы табылмады" });
    }

    const user = userRes.rows[0];
    
    if (user.is_verified) {
      logger.info("Email уже подтвержден", { userId: user.id });
      return res.status(400).json({ message: "Email әлдеқашан расталған" });
    }

    await pool.query("UPDATE users SET is_verified = true WHERE id = $1", [user.id]);

    logger.info("Email подтвержден", { userId: user.id, email: user.email });
    res.json({ message: "✅ Email сәтті расталды! Енді жүйеге кіре аласыз." });
  } catch (err) {
    // Обработка различных типов ошибок JWT
    if (err.name === "TokenExpiredError") {
      logger.error("Ошибка подтверждения email: токен истек", { error: err.message });
      return res.status(400).json({ 
        message: "Растау сілтемесінің мерзімі өткен",
        error: "expired"
      });
    }
    
    if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
      logger.error("Ошибка подтверждения email: недействительный токен", { error: err.message });
      return res.status(400).json({ 
        message: "Растау сілтемесі жарамсыз",
        error: "invalid"
      });
    }
    
    // Обработка других ошибок
    logger.error("Ошибка подтверждения email", { error: err, stack: err.stack });
    return res.status(500).json({ 
      message: "Сервер қатесі. Кейінірек көріңіз.",
      error: "server_error"
    });
  }
});

/* ============================
   🔐 Вход в систему
============================ */
router.post("/login", validateLogin, async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0)
      return res.status(400).json({ message: "Неверный email или пароль" });

    const user = userRes.rows[0];

    // Проверяем подтверждение email
    if (!user.is_verified)
      return res.status(403).json({ message: "Подтвердите email перед входом" });

    // Проверяем пароль
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Неверный email или пароль" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    logger.info("Пользователь вошел в систему", { userId: user.id, email });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    logger.error("Ошибка логина", { email, error: err });
    res.status(500).json({ message: "Ошибка сервера при входе" });
  }
});

/* ============================
   👤 Проверка токена
============================ */
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Нет токена" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRes = await pool.query(
      "SELECT id, email, name, role, is_verified, created_at, settings FROM users WHERE id = $1",
      [decoded.id]
    );
    if (userRes.rows.length === 0)
      return res.status(404).json({ message: "Пользователь не найден" });

    const user = userRes.rows[0];
    // Преобразуем settings из JSONB в объект, если это строка
    if (user.settings && typeof user.settings === 'string') {
      try {
        user.settings = JSON.parse(user.settings);
      } catch (e) {
        user.settings = {};
      }
    } else if (!user.settings) {
      user.settings = {};
    }

    logger.debug("Проверка токена", { userId: decoded.id });
    res.json(user);
  } catch (err) {
    logger.warn("Недействительный токен", { error: err.message });
    res.status(401).json({ message: "Недействительный токен" });
  }
});

/* ============================
   📧 Восстановление пароля
============================ */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ message: "Введите email" });

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0)
      return res.status(404).json({ message: "Пользователь не найден" });

    const user = userRes.rows[0];
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    // Используем переменную окружения для frontend URL или localhost по умолчанию
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    await sendMail(
      email,
      "Восстановление пароля LangApp",
      "Инструкция по восстановлению пароля",
      `<p>Здравствуйте, ${user.name || "пользователь"}!</p>
       <p>Чтобы сбросить пароль, перейдите по ссылке:</p>
       <a href="${resetLink}" style="color:#4F46E5; font-weight:bold;">Сбросить пароль</a>
       <p>⚠️ Ссылка действительна 15 минут.</p>`
    );

    logger.info("Ссылка для сброса пароля отправлена", { email });
    res.json({ message: "📩 Ссылка для сброса пароля отправлена на почту" });
  } catch (err) {
    logger.error("Ошибка восстановления пароля", { email, error: err });
    res.status(500).json({ message: "Ошибка сервера при отправке письма" });
  }
});

/* ============================
   🔑 Сброс пароля
============================ */
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword)
    return res.status(400).json({ message: "Введите новый пароль" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, decoded.id]);

    logger.info("Пароль сброшен", { userId: decoded.id });
    res.json({ message: "✅ Пароль успешно обновлён" });
  } catch (err) {
    logger.error("Ошибка сброса пароля", { error: err });
    res.status(400).json({ message: "Недействительная или истекшая ссылка" });
  }
});

/* ============================
   🔐 Смена пароля (для авторизованных пользователей)
============================ */
const authMiddleware = require("../middleware/authMiddleware");

/* ============================
   ⚙️ Получение настроек пользователя
============================ */
router.get("/settings", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const userRes = await pool.query(
      "SELECT settings FROM users WHERE id = $1",
      [userId]
    );
    
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "Пайдаланушы табылмады" });
    }

    const settings = userRes.rows[0].settings || {};
    res.json(settings);
  } catch (err) {
    logger.error("Ошибка получения настроек", { userId, error: err });
    res.status(500).json({ message: "Сервер қатесі" });
  }
});

/* ============================
   ⚙️ Сохранение настроек пользователя
============================ */
router.put("/settings", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: "Параметрлер дұрыс емес" });
  }

  try {
    await pool.query(
      "UPDATE users SET settings = $1 WHERE id = $2",
      [JSON.stringify(settings), userId]
    );

    logger.info("Настройки сохранены", { userId });
    res.json({ message: "✅ Параметрлер сәтті сақталды", settings });
  } catch (err) {
    logger.error("Ошибка сохранения настроек", { userId, error: err });
    res.status(500).json({ message: "Сервер қатесі. Параметрлерді сақтау мүмкін болмады." });
  }
});

router.post("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Ағымдағы және жаңа құпия сөзді енгізіңіз" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Құпия сөз кемінде 6 таңбадан тұруы керек" });
  }

  try {
    // Получаем пользователя из базы данных
    const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "Пайдаланушы табылмады" });
    }

    const user = userRes.rows[0];

    // Проверяем текущий пароль
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Ағымдағы құпия сөз дұрыс емес" });
    }

    // Хэшируем новый пароль
    const hashed = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, userId]);

    logger.info("Пароль изменен", { userId });
    res.json({ message: "✅ Құпия сөз сәтті өзгертілді" });
  } catch (err) {
    logger.error("Ошибка смены пароля", { userId, error: err });
    res.status(500).json({ message: "Сервер қатесі. Құпия сөзді өзгерту мүмкін болмады." });
  }
});

module.exports = router;
