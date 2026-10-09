// lang-backend/controllers/lessonController.js
const pool = require('../db/db');

exports.listByCourse = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const result = await pool.query('SELECT id, title, content, order_index FROM lessons WHERE course_id=$1 ORDER BY order_index', [courseId]);
    res.json(result.rows);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const id = req.params.id;
    const lesson = (await pool.query('SELECT * FROM lessons WHERE id=$1', [id])).rows[0];
    if (!lesson) return res.status(404).json({ message: 'Сабақ табылмады' });
    res.json(lesson);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { course_id, title, content, order_index } = req.body;
    const result = await pool.query(
      'INSERT INTO lessons (course_id, title, content, order_index) VALUES ($1,$2,$3,$4) RETURNING id, title',
      [course_id, title, content, order_index]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { title, content, order_index } = req.body;
    await pool.query('UPDATE lessons SET title=$1, content=$2, order_index=$3 WHERE id=$4', [title, content, order_index, id]);
    res.json({ message: 'Сабақ жаңартылды' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM lessons WHERE id=$1', [id]);
    res.json({ message: 'Сабақ жойылды' });
  } catch (err) { next(err); }
};
