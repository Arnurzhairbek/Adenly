-- Миграция: добавление недостающих колонок в таблицу progress
-- Выполнить этот скрипт, если таблица progress уже существует

-- Добавляем course_id если его нет
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'progress' AND column_name = 'course_id'
    ) THEN
        ALTER TABLE progress ADD COLUMN course_id INT REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Добавляем completed если его нет
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'progress' AND column_name = 'completed'
    ) THEN
        ALTER TABLE progress ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Добавляем уникальное ограничение если его нет
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'progress_user_id_lesson_id_key'
    ) THEN
        ALTER TABLE progress ADD CONSTRAINT progress_user_id_lesson_id_key UNIQUE(user_id, lesson_id);
    END IF;
END $$;

