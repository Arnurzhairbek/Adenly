// lang-backend/controllers/aiTutorController.js
const pool = require('../db/db');
const logger = require('../utils/logger');

// Анализ прогресса пользователя и генерация рекомендаций
exports.analyzeProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Получаем статистику прогресса
    const progressStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.lesson_id) as lessons_completed,
        COUNT(DISTINCT p.course_id) as courses_in_progress,
        AVG(CASE WHEN p.completed THEN 1 ELSE 0 END) * 100 as completion_rate
      FROM progress p
      WHERE p.user_id = $1
    `, [userId]);

    // Получаем статистику ошибок
    const errorStats = await pool.query(`
      SELECT 
        error_type,
        COUNT(*) as error_count,
        MAX(created_at) as last_error_date
      FROM user_errors
      WHERE user_id = $1
      GROUP BY error_type
      ORDER BY error_count DESC
    `, [userId]);

    // Получаем слабые места (наиболее частые ошибки)
    const weakAreas = errorStats.rows.map(row => ({
      type: row.error_type,
      count: parseInt(row.error_count),
      lastError: row.last_error_date
    }));

    // Получаем достижения
    const achievements = await pool.query(`
      SELECT xp, level, lessons_completed
      FROM achievements
      WHERE user_id = $1
    `, [userId]);

    const achievement = achievements.rows[0] || { xp: 0, level: 1, lessons_completed: 0 };

    // Получаем последние ошибки для детального анализа
    const recentErrors = await pool.query(`
      SELECT 
        e.error_type,
        e.error_text,
        e.correct_text,
        e.context,
        e.created_at,
        c.title as course_title,
        l.title as lesson_title
      FROM user_errors e
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN lessons l ON e.lesson_id = l.id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
      LIMIT 10
    `, [userId]);

    // Генерируем рекомендации на основе анализа
    const recommendations = generateRecommendations({
      progress: progressStats.rows[0],
      weakAreas,
      achievements: achievement,
      recentErrors: recentErrors.rows
    });

    // Вычисляем общий прогресс
    const overallProgress = {
      lessonsCompleted: parseInt(progressStats.rows[0]?.lessons_completed || 0),
      coursesInProgress: parseInt(progressStats.rows[0]?.courses_in_progress || 0),
      completionRate: parseFloat(progressStats.rows[0]?.completion_rate || 0),
      totalErrors: errorStats.rows.reduce((sum, row) => sum + parseInt(row.error_count), 0),
      level: achievement.level,
      xp: achievement.xp
    };

    res.json({
      overallProgress,
      weakAreas,
      recentErrors: recentErrors.rows,
      recommendations,
      insights: generateInsights(overallProgress, weakAreas, achievement)
    });
  } catch (err) {
    logger.error("Ошибка анализа прогресса", { error: err });
    next(err);
  }
};

// Сохранение ошибки пользователя
exports.logError = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { error_type, error_text, correct_text, context, course_id, lesson_id, metadata } = req.body;

    if (!error_type || !error_text) {
      return res.status(400).json({ message: "error_type и error_text обязательны" });
    }

    const result = await pool.query(`
      INSERT INTO user_errors 
      (user_id, course_id, lesson_id, error_type, error_text, correct_text, context, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      userId,
      course_id || null,
      lesson_id || null,
      error_type,
      error_text,
      correct_text || null,
      context || null,
      metadata ? JSON.stringify(metadata) : '{}'
    ]);

    logger.info("Ошибка пользователя залогирована", { userId, error_type });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error("Ошибка сохранения ошибки пользователя", { error: err });
    next(err);
  }
};

// Получение персональных рекомендаций
exports.getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Получаем анализ прогресса
    const analysis = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.lesson_id) as lessons_completed,
        COUNT(DISTINCT p.course_id) as courses_in_progress
      FROM progress p
      WHERE p.user_id = $1
    `, [userId]);

    const errorStats = await pool.query(`
      SELECT error_type, COUNT(*) as count
      FROM user_errors
      WHERE user_id = $1
      GROUP BY error_type
      ORDER BY count DESC
      LIMIT 5
    `, [userId]);

    const recommendations = generateRecommendations({
      progress: analysis.rows[0],
      weakAreas: errorStats.rows.map(r => ({ type: r.error_type, count: parseInt(r.count) }))
    });

    res.json({ recommendations });
  } catch (err) {
    logger.error("Ошибка получения рекомендаций", { error: err });
    next(err);
  }
};

// Генерация рекомендаций на основе данных
function generateRecommendations(data) {
  const recommendations = [];

  const { progress, weakAreas, achievements, recentErrors } = data;

  // Рекомендации на основе слабых мест
  if (weakAreas && weakAreas.length > 0) {
    const topWeakArea = weakAreas[0];
    recommendations.push({
      type: 'weak_area',
      priority: 'high',
      title: `Сфокусируйтесь на ${getErrorTypeName(topWeakArea.type)}`,
      description: `Вы допустили ${topWeakArea.count} ошибок в этой области. Рекомендуем пройти дополнительные упражнения.`,
      action: `Повторить упражнения по ${getErrorTypeName(topWeakArea.type)}`
    });
  }

  // Рекомендации на основе прогресса
  if (progress) {
    const completionRate = parseFloat(progress.completion_rate || 0);
    if (completionRate < 50) {
      recommendations.push({
        type: 'completion',
        priority: 'medium',
        title: 'Завершите начатые уроки',
        description: `Вы завершили только ${Math.round(completionRate)}% уроков. Рекомендуем завершить начатые курсы.`,
        action: 'Продолжить обучение'
      });
    }
  }

  // Рекомендации на основе уровня
  if (achievements) {
    if (achievements.level < 3) {
      recommendations.push({
        type: 'level',
        priority: 'low',
        title: 'Повысьте свой уровень',
        description: `Вы на уровне ${achievements.level}. Завершите больше уроков для повышения уровня.`,
        action: 'Изучить новые уроки'
      });
    }
  }

  // Рекомендации на основе последних ошибок
  if (recentErrors && recentErrors.length > 0) {
    const grammarErrors = recentErrors.filter(e => e.error_type === 'grammar');
    if (grammarErrors.length >= 3) {
      recommendations.push({
        type: 'grammar',
        priority: 'high',
        title: 'Повторите грамматику',
        description: 'Вы допустили несколько грамматических ошибок. Рекомендуем повторить правила грамматики.',
        action: 'Изучить грамматику'
      });
    }
  }

  return recommendations;
}

// Генерация инсайтов
function generateInsights(overallProgress, weakAreas, achievements) {
  const insights = [];

  // Инсайт о прогрессе
  if (overallProgress.lessonsCompleted > 0) {
    insights.push({
      type: 'progress',
      message: `Вы завершили ${overallProgress.lessonsCompleted} уроков! Продолжайте в том же духе!`,
      positive: true
    });
  }

  // Инсайт о слабых местах
  if (weakAreas.length > 0) {
    const topWeakArea = weakAreas[0];
    insights.push({
      type: 'improvement',
      message: `Ваша слабая область: ${getErrorTypeName(topWeakArea.type)}. Сфокусируйтесь на этой теме.`,
      positive: false
    });
  }

  // Инсайт об уровне
  if (achievements.level >= 5) {
    insights.push({
      type: 'achievement',
      message: `Отличная работа! Вы достигли уровня ${achievements.level}!`,
      positive: true
    });
  }

  return insights;
}

// Получение названия типа ошибки
function getErrorTypeName(type) {
  const names = {
    'grammar': 'грамматике',
    'vocabulary': 'словарному запасу',
    'pronunciation': 'произношению',
    'translation': 'переводу',
    'comprehension': 'пониманию'
  };
  return names[type] || type;
}

