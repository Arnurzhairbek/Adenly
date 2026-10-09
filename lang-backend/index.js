require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const createDatabaseIfNotExists = require("./db/createDatabase");
const pool = require("./db/db");
const corsConfig = require("./config/cors");
const { generalLimiter, authLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

// === Импорт роутов ===
const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const lessonRoutes = require("./routes/lessons");
const progressRoutes = require("./routes/progress");
const achievementsRoutes = require("./routes/achievements");
const leaderboardRoutes = require("./routes/leaderboard");
const notificationRoutes = require("./routes/notifications");
const testRoutes = require("./routes/tests");
const certificateRoutes = require("./routes/certificates");
const feedbackRoutes = require("./routes/feedback");
const aiTutorRoutes = require("./routes/aiTutor");
const aiConversationRoutes = require("./routes/aiConversation");

const app = express();
const PORT = process.env.PORT || 5000;
let databaseReady = false;

// === Trust proxy для работы за ngrok/reverse proxy ===
app.set('trust proxy', 1);

// === Middleware ===
// CORS должен быть ПЕРВЫМ, до других middleware
// Обрабатываем OPTIONS запросы вручную для надежности
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Разрешаем localhost для разработки
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
  }
  
  // Обрабатываем OPTIONS запросы
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// Логируем все запросы для отладки CORS (только в dev режиме)
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      logger.debug('OPTIONS request', { 
        origin: req.headers.origin, 
        path: req.path 
      });
    }
    next();
  });
}

app.use(cors(corsConfig)); // CORS из конфига (дополнительная защита)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
})); // Защита от XSS и других атак
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(generalLimiter); // Общий rate limiting

// === Инициализация базы данных и таблиц PostgreSQL ===
(async () => {
  try {
    // Создаём базу данных, если её нет
    try {
      await createDatabaseIfNotExists();
      // Небольшая задержка для завершения создания БД
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (dbErr) {
      logger.warn("Предупреждение при создании базы данных (возможно, уже существует)", { error: dbErr.message });
    }
    
    // Теперь инициализируем таблицы
    const initSQLPath = path.join(__dirname, "db", "init.sql");
    if (fs.existsSync(initSQLPath)) {
      const initSQL = fs.readFileSync(initSQLPath, "utf8");
      await pool.query(initSQL);
      logger.info("Таблицы успешно созданы или уже существуют");

// Применяем миграцию для добавления недостающих колонок
try {
  // Проверяем и добавляем is_verified в users
  const hasIsVerified = await pool.query(`
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_verified'
  `);
  if (hasIsVerified.rows.length === 0) {
    await pool.query(`
      ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE
    `);
    logger.info("Добавлена колонка is_verified в users");
  }

  // Проверяем и добавляем settings в users
  const hasSettings = await pool.query(`
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'settings'
  `);
  if (hasSettings.rows.length === 0) {
    await pool.query(`
      ALTER TABLE users ADD COLUMN settings JSONB DEFAULT '{}'::jsonb
    `);
    logger.info("Добавлена колонка settings в users");
  }

  // Проверяем существование таблиц для тестов
  const hasTestsTable = await pool.query(`
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'tests'
  `);
  if (hasTestsTable.rows.length === 0) {
    logger.info("Таблицы для тестов будут созданы при следующем запуске init.sql");
  }

  // Проверяем и создаем таблицу feedback
  const hasFeedbackTable = await pool.query(`
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'feedback'
  `);
  if (hasFeedbackTable.rows.length === 0) {
    await pool.query(`
      CREATE TABLE feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info("Таблица feedback создана");
  }

  // Проверяем и добавляем course_id
  const hasCourseId = await pool.query(`
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'progress' AND column_name = 'course_id'
  `);
  if (hasCourseId.rows.length === 0) {
    await pool.query(`
      ALTER TABLE progress ADD COLUMN course_id INT REFERENCES courses(id) ON DELETE CASCADE
    `);
    logger.info("Добавлена колонка course_id в progress");
  }

  // Проверяем и добавляем completed
  const hasCompleted = await pool.query(`
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'progress' AND column_name = 'completed'
  `);
  if (hasCompleted.rows.length === 0) {
    await pool.query(`
      ALTER TABLE progress ADD COLUMN completed BOOLEAN DEFAULT FALSE
    `);
    logger.info("Добавлена колонка completed в progress");
  }

  // Проверяем и добавляем уникальное ограничение
  const hasConstraint = await pool.query(`
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'progress_user_id_lesson_id_key'
  `);
  if (hasConstraint.rows.length === 0) {
    await pool.query(`
      ALTER TABLE progress ADD CONSTRAINT progress_user_id_lesson_id_key UNIQUE(user_id, lesson_id)
    `);
    logger.info("Добавлено уникальное ограничение на progress");
  }

  // Применяем миграцию для AI-репетитора
  const hasUserErrorsTable = await pool.query(`
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_errors'
  `);
  if (hasUserErrorsTable.rows.length === 0) {
    const migrationPath = path.join(__dirname, "db", "migration_add_user_errors.sql");
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, "utf8");
      await pool.query(migrationSQL);
      logger.info("Таблицы для AI-репетитора созданы");
    }
  }

  // Проверяем и добавляем metadata в ai_conversations если его нет
  const hasMetadataColumn = await pool.query(`
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_conversations' AND column_name = 'metadata'
  `);
  if (hasMetadataColumn.rows.length === 0) {
    await pool.query(`
      ALTER TABLE ai_conversations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb
    `);
    logger.info("Добавлена колонка metadata в ai_conversations");
  }

                // Создаем индексы для производительности
                const indexesSQLPath = path.join(__dirname, "db", "indexes.sql");
                if (fs.existsSync(indexesSQLPath)) {
                  const indexesSQL = fs.readFileSync(indexesSQLPath, "utf8");
                  await pool.query(indexesSQL);
                  logger.info("Индексы успешно созданы");
                }
              } catch (migrationErr) {
                logger.warn("Ошибка при миграции (возможно, уже применена)", { error: migrationErr });
              }

              // Загружаем тестовые курсы и уроки если их нет
              try {
                const coursesCount = await pool.query("SELECT COUNT(*) FROM courses");
                const coursesNum = parseInt(coursesCount.rows[0].count);
                
                if (coursesNum === 0) {
                  const seedSQLPath = path.join(__dirname, "db", "seed.sql");
                  if (fs.existsSync(seedSQLPath)) {
                    const seedSQL = fs.readFileSync(seedSQLPath, "utf8");
                    await pool.query(seedSQL);
                    logger.info("✅ Тестовые курсы и уроки успешно загружены!");
                    
                    // Показываем статистику
                    const stats = await pool.query(`
                      SELECT 
                        (SELECT COUNT(*) FROM courses) as total_courses,
                        (SELECT COUNT(*) FROM lessons) as total_lessons,
                        (SELECT COUNT(*) FROM tests) as total_tests
                    `);
                    logger.info(`📊 Загружено: ${stats.rows[0].total_courses} курсов, ${stats.rows[0].total_lessons} уроков, ${stats.rows[0].total_tests} тестов`);
                  }
                } else {
                  // Проверяем наличие тестов для каждого курса и создаем их, если нужно
                  const coursesWithTests = await pool.query(`
                    SELECT c.id, c.title, COUNT(t.id) as test_count
                    FROM courses c
                    LEFT JOIN tests t ON c.id = t.course_id
                    GROUP BY c.id, c.title
                  `);
                  
                  const coursesWithoutTests = coursesWithTests.rows.filter(c => parseInt(c.test_count) === 0);
                  
                  if (coursesWithoutTests.length > 0) {
                    logger.info(`📝 Найдено ${coursesWithoutTests.length} курсов без тестов. Загружаем тесты...`);
                    const addTestsSQLPath = path.join(__dirname, "db", "add-tests.sql");
                    if (fs.existsSync(addTestsSQLPath)) {
                      const addTestsSQL = fs.readFileSync(addTestsSQLPath, "utf8");
                      // Выполняем add-tests.sql - DO $$ блоки безопасны для повторного выполнения
                      // Они проверяют существование перед созданием
                      try {
                        await pool.query(addTestsSQL);
                        const newTestsCount = await pool.query("SELECT COUNT(*) FROM tests");
                        const newTestsNum = parseInt(newTestsCount.rows[0].count);
                        logger.info(`✅ Тесты загружены! Теперь в базе ${newTestsNum} тестов`);
                      } catch (seedErr) {
                        logger.warn("Ошибка при загрузке тестов (возможно, уже существуют)", { error: seedErr.message });
                      }
                    }
                  } else {
                    const testsCount = await pool.query("SELECT COUNT(*) FROM tests");
                    const testsNum = parseInt(testsCount.rows[0].count);
                    logger.info(`📚 В базе уже есть ${coursesNum} курсов и ${testsNum} тестов`);
                  }
                }
              } catch (seedErr) {
                logger.warn("Ошибка при загрузке тестовых данных", { error: seedErr });
              }
    } else {
      throw new Error("Missing db/init.sql");
    }
    databaseReady = true;
  } catch (err) {
    logger.error("Ошибка при инициализации таблиц", { error: err });
    process.exit(1);
  }
})();

// === Подключение роутов ===
app.use("/api/auth", authLimiter, authRoutes); // Строгий лимит для авторизации
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/achievements", achievementsRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/ai-tutor", aiTutorRoutes);
app.use("/api/ai-conversation", aiConversationRoutes);

// === Статические файлы (например, изображения) ===
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// === Тестовый эндпоинт ===
app.get("/", (req, res) => {
  res.json({ 
    message: "🌍 Adenly Backend работает с PostgreSQL 🚀",
    version: "1.0.0",
    status: "ok"
  });
});

// === Health check ===
app.get("/health", (req, res) => {
  res.status(databaseReady ? 200 : 503).json({
    databaseReady, 
    status: databaseReady ? "ok" : "starting",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// === Глобальный обработчик ошибок (должен быть последним!) ===
app.use(errorHandler);

// === Запуск сервера ===
// Запускаем сервер сразу, независимо от инициализации БД
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`✅ Сервер запущен на порту ${PORT}`);
  logger.info(`🌐 Доступен по адресу: http://localhost:${PORT}`);
  logger.info(`📋 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔧 CORS настроен для: localhost:5173, localhost:3000`);
});

// === Обработка необработанных ошибок ===
process.on("unhandledRejection", (err) => {
  logger.error("Необработанное отклонение промиса", { error: err });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Необработанное исключение", { error: err });
  process.exit(1);
});
