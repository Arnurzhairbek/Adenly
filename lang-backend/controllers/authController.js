const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');
const { sendMail } = require('../utils/mailer'); 
require('dotenv').config();

const jwtExpires = process.env.JWT_EXPIRES_IN || '7d';

// === 📩 Регистрация ===
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email және құпия сөз міндетті' });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length)
      return res.status(400).json({ message: 'Пайдаланушы қазірдің өзінде бар' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1,$2,$3)',
      [email, hashed, name || null]
    );

    // Можно отправить приветственное письмо
    await sendMail(
      email,
      'Adenly-ға қош келдіңіз!',
      `<h2>Сәлеметсіз бе, ${name || 'пайдаланушы'}!</h2>
       <p>Сіз Adenly-ға сәтті тіркелдіңіз 🎉</p>`
    );

    res.status(201).json({ message: 'Тіркелу сәтті, хат жіберілді' });
  } catch (err) {
    next(err);
  }
};

// === 🔐 Логин ===
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: 'Дұрыс емес email немесе құпия сөз' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Дұрыс емес email немесе құпия сөз' });

    const payload = { id: user.id, email: user.email, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: jwtExpires });

    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
};

// === 👤 Профиль ===
exports.me = async (req, res, next) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ message: 'Пайдаланушы жоқ' });
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// === 📧 Забыли пароль ===
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Пайдаланушы табылмады' });

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Используем переменную окружения для frontend URL или localhost по умолчанию
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    await sendMail(
      email,
      'Adenly құпия сөзді қалпына келтіру',
      `<p>Сәлеметсіз бе!</p>
       <p>Құпия сөзді қалпына келтіру үшін сілтемеге өтіңіз:</p>
       <a href="${resetLink}">${resetLink}</a>
       <p>Сілтеме 15 минутқа жарамды.</p>`
    );

    res.json({ message: 'Қалпына келтіру сілтемесі email-ге жіберілді' });
  } catch (err) {
    next(err);
  }
};

// === 🔑 Сброс пароля ===
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashed = await bcrypt.hash(password, 10);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, decoded.id]);

    res.json({ message: 'Құпия сөз сәтті өзгертілді' });
  } catch (err) {
    console.error('Ошибка сброса пароля:', err);
    res.status(400).json({ message: 'Дұрыс емес немесе мерзімі өткен токен' });
  }
};
