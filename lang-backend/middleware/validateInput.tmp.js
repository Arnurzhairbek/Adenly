// Временная заглушка на случай, если express-validator еще не установлен
// После установки npm install express-validator этот файл можно удалить

let expressValidator;
try {
  expressValidator = require('express-validator');
} catch (e) {
  console.warn('⚠️ express-validator не установлен. Установите: npm install express-validator');
  // Создаем простые заглушки
  expressValidator = {
    body: () => (req, res, next) => next(),
    param: () => (req, res, next) => next(),
    query: () => (req, res, next) => next(),
  };
  exports.validationResult = () => ({ isEmpty: () => true, array: () => [] });
}

const { body, param, query, validationResult } = expressValidator;

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Ошибка валидации",
      errors: errors.array(),
    });
  }
  next();
};

// Валидация регистрации
exports.validateRegister = [
  body("email")
    .isEmail()
    .withMessage("Некорректный email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Пароль должен быть минимум 6 символов"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Имя должно быть от 2 до 100 символов"),
  handleValidationErrors,
];

// Валидация логина
exports.validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Некорректный email")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Пароль обязателен"),
  handleValidationErrors,
];

// Валидация прогресса (user_id берется из токена, не валидируем)
exports.validateProgress = [
  body("lesson_id")
    .isInt({ min: 1 })
    .withMessage("lesson_id должен быть положительным числом"),
  body("course_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("course_id должен быть положительным числом"),
  body("completed")
    .optional()
    .isBoolean()
    .withMessage("completed должен быть boolean"),
  handleValidationErrors,
];

// Валидация параметров user_id
exports.validateUserId = [
  param("user_id")
    .isInt({ min: 1 })
    .withMessage("user_id должен быть положительным числом"),
  handleValidationErrors,
];

// Валидация достижений
exports.validateAchievements = [
  body("user_id")
    .isInt({ min: 1 })
    .withMessage("user_id должен быть положительным числом"),
  body("xp_to_add")
    .optional()
    .isInt({ min: 0 })
    .withMessage("xp_to_add должен быть неотрицательным числом"),
  handleValidationErrors,
];

