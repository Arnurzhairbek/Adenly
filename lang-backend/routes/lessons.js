const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const upload = require('../middleware/uploadMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// 📘 Получить все уроки по курсу
router.get('/course/:courseId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lessons WHERE course_id = $1 ORDER BY id ASC', [req.params.courseId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при получении уроков', error: err.message });
  }
});

// 📗 Добавить урок с медиафайлом
router.post('/', adminMiddleware, upload.single('media'), async (req, res) => {
  const { course_id, title, content } = req.body;
  const media_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      'INSERT INTO lessons (course_id, title, content, media_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [course_id, title, content, media_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при добавлении урока', error: err.message });
  }
});

// 📕 Получить один урок
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lessons WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Урок не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при получении урока', error: err.message });
  }
});

// ✏️ Обновление урока (только админ)
router.put('/:id', adminMiddleware, upload.single('media'), async (req, res) => {
  const { title, content } = req.body;
  const media_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `UPDATE lessons 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           media_url = COALESCE($3, media_url)
       WHERE id = $4
       RETURNING *`,
      [title, content, media_url, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Урок не найден' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при обновлении урока', error: err.message });
  }
});

// ❌ Удаление урока (только админ)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM lessons WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Урок не найден' });

    res.json({ message: 'Урок удалён', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при удалении урока', error: err.message });
  }
});


module.exports = router;
