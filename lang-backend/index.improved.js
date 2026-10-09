// Пример улучшенного index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
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

const app = express();
const PORT = process.env.PORT || 5000;

// === Middleware ===
app.use(helmet()); // Защита от XSS и других атак
app.use(cors(corsConfig)); // CORS из конфига
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(generalLimiter); // Общий rate limiting

// === Инициализация таблиц PostgreSQL ===
(async () => {
  try {
    const initSQLPath = path.join(__dirname, "db", "init.sql");
    if (fs.existsSync(initSQLPath)) {
      const initSQL = fs.readFileSync(initSQLPath, "utf8");
      await pool.query(initSQL);
      logger.info("Таблицы успешно созданы или уже существуют");

      // Применяем миграцию для добавления недостающих колонок
      try {
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
    } else {
      logger.warn("Файл init.sql не найден — пропуск инициализации таблиц");
    }
  } catch (err) {
    logger.error("Ошибка при инициализации таблиц", { error: err });
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
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// === Глобальный обработчик ошибок (должен быть последним!) ===
app.use(errorHandler);

// === Запуск сервера ===
app.listen(PORT, () => {
  logger.info(`Сервер запущен на порту ${PORT}`);
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

