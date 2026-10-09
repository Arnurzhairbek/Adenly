// Временная заглушка на случай, если express-rate-limit еще не установлен
// После установки npm install express-rate-limit этот файл можно удалить

let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  // Если модуль не установлен, создаем простую заглушку
  console.warn('⚠️ express-rate-limit не установлен. Установите: npm install express-rate-limit');
  rateLimit = () => (req, res, next) => next(); // Пропускает все запросы
}

// Общий лимит для всех запросов
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: "Слишком много запросов с этого IP, попробуйте позже",
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий лимит для авторизации
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа
  message: "Слишком много попыток входа, попробуйте через 15 минут",
  skipSuccessfulRequests: true,
});

// Лимит для API запросов
exports.apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 60, // 60 запросов в минуту
  message: "Слишком много запросов, подождите немного",
});

