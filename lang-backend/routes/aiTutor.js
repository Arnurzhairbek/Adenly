// lang-backend/routes/aiTutor.js
const express = require('express');
const router = express.Router();
const aiTutorController = require('../controllers/aiTutorController');
const authMiddleware = require('../middleware/authMiddleware');

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// Анализ прогресса пользователя
router.get('/analyze', aiTutorController.analyzeProgress);

// Сохранение ошибки пользователя
router.post('/errors', aiTutorController.logError);

// Получение рекомендаций
router.get('/recommendations', aiTutorController.getRecommendations);

module.exports = router;

