// lang-backend/utils/jwt.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "super_secret_key";

/**
 * Создаёт токен для пользователя
 * @param {object} payload — данные, которые будут в токене (например, id, email)
 */
function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" }); // токен живёт 7 дней
}

/**
 * Проверяет токен (используется в middleware)
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
