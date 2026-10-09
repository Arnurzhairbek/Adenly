// lang-backend/routes/aiConversation.js
const express = require('express');
const router = express.Router();
const aiConversationController = require('../controllers/aiConversationController');
const authMiddleware = require('../middleware/authMiddleware');

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// Начать новую разговорную практику
router.post('/start', aiConversationController.startConversation);

// Отправить сообщение
router.post('/:conversationId/message', aiConversationController.sendMessage);

// Завершить разговор
router.post('/:conversationId/end', aiConversationController.endConversation);

// Получить историю разговоров
router.get('/history', aiConversationController.getConversationHistory);

module.exports = router;

