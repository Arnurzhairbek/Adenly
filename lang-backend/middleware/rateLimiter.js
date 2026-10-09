const rateLimit = require('express-rate-limit');

// Определяем режим разработки (по умолчанию считаем dev, если не указано явно)
const isDevelopment = !process.env.NODE_ENV || ['development', 'test'].includes(process.env.NODE_ENV);

// Общий лимит для всех запросов
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: isDevelopment ? 1000 : 100, // В dev режиме больше лимит
  message: "Слишком много запросов с этого IP, попробуйте позже",
  standardHeaders: true,
  legacyHeaders: false,
  // Пропускаем OPTIONS запросы (CORS preflight)
  skip: (req) => {
    return req.method === 'OPTIONS';
  },
});

// Строгий лимит для авторизации
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: isDevelopment ? 50 : 5, // В dev режиме больше попыток
  message: "Слишком много попыток входа, попробуйте через 15 минут",
  skipSuccessfulRequests: true,
});

// Лимит для API запросов
exports.apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: isDevelopment ? 300 : 60, // В dev режиме больше запросов
  message: "Слишком много запросов, подождите немного",
});
