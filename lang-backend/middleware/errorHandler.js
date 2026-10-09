const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error('Ошибка обработки запроса', {
    path: req.path,
    method: req.method,
    error: err,
  });

  // Не показываем детали ошибки в продакшене
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    message: err.message || 'Внутренняя ошибка сервера',
    ...(isDevelopment && { 
      stack: err.stack,
      details: err 
    }),
  });
};
