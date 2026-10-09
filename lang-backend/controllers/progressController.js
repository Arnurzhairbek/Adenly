// lang-backend/controllers/progressController.js
const pool = require('../db/db');

exports.getUserProgress = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const result = await pool.query(
      `SELECT p.id, p.user_id, p.lesson_id, p.status, p.updated_at, l.title, c.title as course_title
       FROM progress p
       JOIN lessons l ON p.lesson_id = l.id
       JOIN courses c ON l.course_id = c.id
       WHERE p.user_id = $1 ORDER BY p.updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

exports.updateProgress = async (req, res, next) => {
  try {
    const { user_id, lesson_id, status } = req.body;
    // либо обновим, либо вставим
    const existing = await pool.query('SELECT id FROM progress WHERE user_id=$1 AND lesson_id=$2', [user_id, lesson_id]);
    if (existing.rows.length) {
      await pool.query('UPDATE progress SET status=$1, updated_at=NOW() WHERE id=$2', [status, existing.rows[0].id]);
      return res.json({ message: 'Прогресс жаңартылды' });
    } else {
      const result = await pool.query('INSERT INTO progress (user_id, lesson_id, status) VALUES ($1,$2,$3) RETURNING id', [user_id, lesson_id, status]);
      return res.status(201).json({ id: result.rows[0].id, message: 'Прогресс құрылды' });
    }
  } catch (err) { next(err); }
};
