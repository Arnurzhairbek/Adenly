-- Индексы для улучшения производительности базы данных

-- Индекс для быстрого поиска пользователей по email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Индексы для таблицы progress
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson_id ON progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_course_id ON progress(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON progress(completed);

-- Индекс для таблицы lessons
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);

-- Индексы для таблицы notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Индекс для таблицы achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

