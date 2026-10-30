const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');
const logger = require('../utils/logger');

router.get('/:courseId/lessons', require('../controllers/courseLessonsController').listCourseLessons);

// 📘 Получить все курсы
router.get('/', async (req, res) => {
  try {
    // Простой запрос - получаем только существующие колонки
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        description, 
        language_from,
        language_to,
        created_at
      FROM courses 
      ORDER BY id ASC
    `);
    
    // Добавляем поле language для обратной совместимости (используем language_to)
    const courses = result.rows.map(course => ({
      ...course,
      language: course.language_to || null
    }));
    
    res.json(courses);
  } catch (err) {
    logger.error('Ошибка при получении курсов', { 
      error: err.message, 
      stack: err.stack,
      details: err 
    });
    res.status(500).json({ 
      message: 'Ошибка при получении курсов', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Внутренняя ошибка сервера'
    });
  }
});

// 📗 Добавить курс (с изображением)
router.post('/', adminMiddleware, upload.single('image'), async (req, res) => {
  const { title, description, language } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      'INSERT INTO courses (title, description, language, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, language, image]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при добавлении курса', error: err.message });
  }
});

// 📕 Получить курс по ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Курс не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при получении курса', error: err.message });
  }
});

// ✏️ Обновление курса (только админ)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { title, description } = req.body;

  try {
    const result = await pool.query(
      'UPDATE courses SET title = $1, description = $2 WHERE id = $3 RETURNING *',
      [title, description, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Курс не найден' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при обновлении курса', error: err.message });
  }
});

// ❌ Удаление курса (только админ)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Курс не найден' });

    res.json({ message: 'Курс удалён', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при удалении курса', error: err.message });
  }
});


module.exports = router;
