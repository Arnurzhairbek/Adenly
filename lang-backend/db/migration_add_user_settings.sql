-- Миграция для добавления колонки settings в таблицу users
-- Выполняется автоматически при запуске сервера, если колонка не существует

-- Проверяем существование колонки и добавляем, если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'settings'
  ) THEN
    ALTER TABLE users ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Колонка settings добавлена в таблицу users';
  ELSE
    RAISE NOTICE 'Колонка settings уже существует';
  END IF;
END $$;

