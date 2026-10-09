// lang-backend/utils/hash.js
const bcrypt = require("bcrypt");

// Количество раундов "соли" — чем выше, тем безопаснее, но медленнее
const SALT_ROUNDS = 10;

/**
 * Хэширует пароль (используется при регистрации)
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Сравнивает пароль с хэшем (используется при входе)
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = { hashPassword, comparePassword };
