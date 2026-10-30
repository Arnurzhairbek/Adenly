const pool = require('../db/db');

// Shared by both supported URLs so existing clients keep the same behavior.
exports.listCourseLessons = async (req, res) => {
  const id = req.params.courseId;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) > 2147483647) {
    return res.status(400).json({ message: 'Курс ID жарамсыз' });
  }
  try {
    const course = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
    if (!course.rows.length) return res.status(404).json({ message: 'Курс табылмады' });
    const lessons = await pool.query('SELECT * FROM lessons WHERE course_id = $1 ORDER BY id ASC', [id]);
    res.json(lessons.rows);
  } catch {
    res.status(500).json({ message: 'Сабақтарды алу қатесі' });
  }
};
