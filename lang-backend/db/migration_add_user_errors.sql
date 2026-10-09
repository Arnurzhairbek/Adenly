-- Миграция для добавления таблицы отслеживания ошибок пользователя
-- Используется для AI-репетитора

CREATE TABLE IF NOT EXISTS user_errors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
    error_type VARCHAR(100) NOT NULL, -- 'grammar', 'vocabulary', 'pronunciation', 'translation', 'comprehension'
    error_text TEXT, -- Текст ошибки пользователя
    correct_text TEXT, -- Правильный вариант
    context TEXT, -- Контекст ошибки (упражнение, вопрос и т.д.)
    metadata JSONB DEFAULT '{}'::jsonb, -- Дополнительная информация
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_errors_user_id ON user_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_errors_error_type ON user_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_user_errors_created_at ON user_errors(created_at);

-- Таблица для хранения истории разговорной практики с AI
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
    language VARCHAR(50) NOT NULL, -- Язык разговора
    topic VARCHAR(200), -- Тема разговора
    messages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Массив сообщений
    metadata JSONB DEFAULT '{}'::jsonb, -- Дополнительная информация (личность друга и т.д.)
    duration_seconds INTEGER, -- Длительность разговора в секундах
    score INTEGER, -- Оценка разговора (0-100)
    feedback TEXT, -- Обратная связь от AI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);

