// lang-backend/controllers/courseController.js
const pool = require('../db/db');

exports.list = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, title, description, language_from, language_to, created_at FROM courses ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const id = req.params.id;
    const course = (await pool.query('SELECT * FROM courses WHERE id = $1', [id])).rows[0];
    if (!course) return res.status(404).json({ message: 'Курс табылмады' });
    const lessons = (await pool.query('SELECT id, title, order_index FROM lessons WHERE course_id = $1 ORDER BY order_index', [id])).rows;
    res.json({ course, lessons });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, language_from, language_to } = req.body;
    const result = await pool.query(
      'INSERT INTO courses (title, description, language_from, language_to) VALUES ($1,$2,$3,$4) RETURNING id, title, description',
      [title, description, language_from, language_to]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { title, description, language_from, language_to } = req.body;
    await pool.query(
      'UPDATE courses SET title=$1, description=$2, language_from=$3, language_to=$4 WHERE id=$5',
      [title, description, language_from, language_to, id]
    );
    res.json({ message: 'Курс жаңартылды' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM courses WHERE id=$1', [id]);
    res.json({ message: 'Курс жойылды' });
  } catch (err) { next(err); }
};
