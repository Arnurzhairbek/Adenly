// Конфигурация CORS из переменных окружения

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

module.exports = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (мобильные приложения, Postman и т.д.)
    if (!origin) return callback(null, true);
    
    // Разрешаем localhost на любом порту для разработки
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Разрешаем ngrok домены для разработки
    if (origin.includes('.ngrok.io') || origin.includes('.ngrok-free.app') || origin.includes('.ngrok-free.dev')) {
      return callback(null, true);
    }
    
    // Разрешаем Cloudflare Tunnel домены для разработки
    if (origin.includes('.trycloudflare.com') || origin.includes('.loca.lt')) {
      return callback(null, true);
    }
    
    // Разрешаем локальную сеть (192.168.x.x, 10.x.x.x)
    if (origin.match(/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/)) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Не разрешено политикой CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

