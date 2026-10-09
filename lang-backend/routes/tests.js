const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const logger = require('../utils/logger');

// 📋 Получить все тесты по курсу
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        COUNT(DISTINCT tq.id) as total_questions,
        COUNT(DISTINCT ta_attempts.id) as total_attempts
      FROM tests t
      LEFT JOIN test_questions tq ON t.id = tq.test_id
      LEFT JOIN test_attempts ta_attempts ON t.id = ta_attempts.test_id AND ta_attempts.user_id = $2
      WHERE t.course_id = $1 AND t.is_active = TRUE
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, [req.params.courseId, req.user.id]);

    // Добавляем информацию о последней попытке
    const testsWithAttempts = await Promise.all(result.rows.map(async (test) => {
      const lastAttempt = await pool.query(`
        SELECT * FROM test_attempts 
        WHERE test_id = $1 AND user_id = $2 
        ORDER BY started_at DESC 
        LIMIT 1
      `, [test.id, req.user.id]);

      return {
        ...test,
        last_attempt: lastAttempt.rows[0] || null,
        attempts_count: parseInt(test.total_attempts) || 0
      };
    }));

    res.json(testsWithAttempts);
  } catch (err) {
    logger.error('Ошибка при получении тестов', { error: err });
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// 📝 Получить тест с вопросами (для прохождения)
router.get('/:testId/start', authMiddleware, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;

    // Проверяем количество попыток
    const test = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);
    if (test.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден' });
    }

    const testData = test.rows[0];
    const attemptsCount = await pool.query(`
      SELECT COUNT(*) FROM test_attempts 
      WHERE test_id = $1 AND user_id = $2
    `, [testId, userId]);

    if (parseInt(attemptsCount.rows[0].count) >= testData.max_attempts) {
      return res.status(403).json({ 
        message: `Достигнуто максимальное количество попыток (${testData.max_attempts})` 
      });
    }

    // Получаем вопросы с ответами
    const questions = await pool.query(`
      SELECT 
        tq.*,
        json_agg(
          json_build_object(
            'id', ta.id,
            'answer_text', ta.answer_text,
            'order_index', ta.order_index
          ) ORDER BY ta.order_index
        ) as answers
      FROM test_questions tq
      LEFT JOIN test_answers ta ON tq.id = ta.question_id
      WHERE tq.test_id = $1
      GROUP BY tq.id
      ORDER BY tq.order_index
    `, [testId]);

    // Убираем правильные ответы для клиента
    const questionsForClient = questions.rows.map(q => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      order_index: q.order_index,
      answers: q.answers.map(a => ({
        id: a.id,
        answer_text: a.answer_text,
        order_index: a.order_index
      }))
    }));

    res.json({
      test: {
        id: testData.id,
        title: testData.title,
        description: testData.description,
        time_limit: testData.time_limit,
        passing_score: testData.passing_score
      },
      questions: questionsForClient
    });
  } catch (err) {
    logger.error('Ошибка при получении теста', { error: err });
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// ✅ Отправить ответы на тест
router.post('/:testId/submit', authMiddleware, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;
    const { responses, time_taken } = req.body; // responses: [{question_id, answer_id, user_answer}]

    // Создаем попытку
    const attemptResult = await pool.query(`
      INSERT INTO test_attempts (test_id, user_id, started_at, completed_at, time_taken)
      VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3)
      RETURNING *
    `, [testId, userId, time_taken || 0]);

    const attemptId = attemptResult.rows[0].id;

    let totalPoints = 0;
    let earnedPoints = 0;
    let correctAnswers = 0;

    // Обрабатываем каждый ответ
    for (const response of responses) {
      const { question_id, answer_id, user_answer } = response;

      // Получаем вопрос и правильный ответ
      const question = await pool.query('SELECT * FROM test_questions WHERE id = $1', [question_id]);
      if (question.rows.length === 0) continue;

      const questionData = question.rows[0];
      totalPoints += questionData.points;

      let isCorrect = false;
      let pointsEarned = 0;

      if (questionData.question_type === 'multiple_choice' && answer_id) {
        // Проверяем правильность выбранного ответа
        const answer = await pool.query('SELECT is_correct FROM test_answers WHERE id = $1', [answer_id]);
        if (answer.rows.length > 0 && answer.rows[0].is_correct) {
          isCorrect = true;
          pointsEarned = questionData.points;
          correctAnswers++;
        }
      } else if (questionData.question_type === 'true_false' && answer_id) {
        const answer = await pool.query('SELECT is_correct FROM test_answers WHERE id = $1', [answer_id]);
        if (answer.rows.length > 0 && answer.rows[0].is_correct) {
          isCorrect = true;
          pointsEarned = questionData.points;
          correctAnswers++;
        }
      } else if (questionData.question_type === 'fill_blank' && user_answer) {
        // Для fill_blank проверяем, есть ли правильный ответ с таким текстом
        const correctAnswer = await pool.query(
          'SELECT id FROM test_answers WHERE question_id = $1 AND LOWER(TRIM(answer_text)) = LOWER(TRIM($2))',
          [question_id, user_answer]
        );
        if (correctAnswer.rows.length > 0) {
          isCorrect = true;
          pointsEarned = questionData.points;
          correctAnswers++;
        }
      }

      earnedPoints += pointsEarned;

      // Сохраняем ответ
      await pool.query(`
        INSERT INTO test_responses (attempt_id, question_id, answer_id, user_answer, is_correct, points_earned)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [attemptId, question_id, answer_id || null, user_answer || null, isCorrect, pointsEarned]);
    }

    // Вычисляем процент
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const test = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);
    const passingScore = test.rows[0].passing_score;
    const passed = score >= passingScore;

    // Обновляем попытку
    await pool.query(`
      UPDATE test_attempts 
      SET score = $1, total_questions = $2, correct_answers = $3, passed = $4
      WHERE id = $5
    `, [score, responses.length, correctAnswers, passed, attemptId]);

    // Если тест пройден, создаем сертификат
    let certificate = null;
    if (passed) {
      const courseId = test.rows[0].course_id;
      const certificateNumber = `CERT-${Date.now()}-${userId}-${testId}`;
      
      const certResult = await pool.query(`
        INSERT INTO certificates (user_id, course_id, test_id, certificate_number, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        userId,
        courseId,
        testId,
        certificateNumber,
        JSON.stringify({ score, correct_answers: correctAnswers, total_questions: responses.length })
      ]);

      certificate = certResult.rows[0];

      // Добавляем XP за прохождение теста
      try {
        await pool.query(`
          UPDATE achievements 
          SET xp = xp + 100,
              level = level + FLOOR((xp + 100) / 1000) - FLOOR(xp / 1000),
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
        `, [userId]);
      } catch (err) {
        logger.warn('Ошибка при добавлении XP', { error: err });
      }

      // Создаем уведомление
      try {
        await pool.query(`
          INSERT INTO notifications (user_id, message, type)
          VALUES ($1, $2, 'success')
        `, [userId, `🎉 Поздравляем! Вы прошли тест "${test.rows[0].title}" и получили сертификат!`]);
      } catch (err) {
        logger.warn('Ошибка при создании уведомления', { error: err });
      }
    }

    logger.info('Тест завершен', { userId, testId, score, passed });

    res.json({
      attempt_id: attemptId,
      score,
      total_questions: responses.length,
      correct_answers: correctAnswers,
      passed,
      certificate
    });
  } catch (err) {
    logger.error('Ошибка при отправке ответов', { error: err });
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// 📊 Получить результаты попытки
router.get('/attempts/:attemptId', authMiddleware, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    const attempt = await pool.query(`
      SELECT ta.*, t.title as test_title, c.title as course_title
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      JOIN courses c ON t.course_id = c.id
      WHERE ta.id = $1 AND ta.user_id = $2
    `, [attemptId, userId]);

    if (attempt.rows.length === 0) {
      return res.status(404).json({ message: 'Попытка не найдена' });
    }

    // Получаем ответы
    const responses = await pool.query(`
      SELECT 
        tr.*,
        tq.question_text,
        tq.question_type,
        tq.points,
        ta.answer_text as correct_answer_text
      FROM test_responses tr
      JOIN test_questions tq ON tr.question_id = tq.id
      LEFT JOIN test_answers ta ON tr.answer_id = ta.id
      WHERE tr.attempt_id = $1
      ORDER BY tq.order_index
    `, [attemptId]);

    res.json({
      attempt: attempt.rows[0],
      responses: responses.rows
    });
  } catch (err) {
    logger.error('Ошибка при получении результатов', { error: err });
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// 📋 Получить все попытки пользователя по тесту
router.get('/:testId/attempts', authMiddleware, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;

    const attempts = await pool.query(`
      SELECT * FROM test_attempts
      WHERE test_id = $1 AND user_id = $2
      ORDER BY started_at DESC
    `, [testId, userId]);

    res.json(attempts.rows);
  } catch (err) {
    logger.error('Ошибка при получении попыток', { error: err });
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// 🔧 АДМИН: Создать тест
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { course_id, title, description, passing_score, time_limit, max_attempts, questions } = req.body;

    const testResult = await pool.query(`
      INSERT INTO tests (course_id, title, description, passing_score, time_limit, max_attempts)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [course_id, title, description, passing_score || 70, time_limit || null, max_attempts || 3]);

    const testId = testResult.rows[0].id;

    // Добавляем вопросы
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const questionResult = await pool.query(`
        INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [testId, question.question_text, question.question_type || 'multiple_choice', question.points || 1, i]);

      const questionId = questionResult.rows[0].id;

      // Добавляем ответы
      for (let j = 0; j < question.answers.length; j++) {
        const answer = question.answers[j];
        await pool.query(`
          INSERT INTO test_answers (question_id, answer_text, is_correct, order_index)
          VALUES ($1, $2, $3, $4)
        `, [questionId, answer.answer_text, answer.is_correct || false, j]);
      }
    }

    logger.info('Тест создан', { testId, course_id });
    res.status(201).json(testResult.rows[0]);
  } catch (err) {
    logger.error('Ошибка при создании теста', { error: err });
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

module.exports = router;

