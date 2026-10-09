# 🚀 Инструкция по запуску бэкенда

## Проблема
Ошибка `ERR_CONNECTION_REFUSED` означает, что бэкенд сервер не запущен.

## Решение

### 1. Создайте файл `.env` в папке `lang-backend`

Создайте файл `.env` со следующим содержимым:

```env
# База данных PostgreSQL
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lang_db
DB_PASS=your_password
DB_PORT=5432

# JWT секретный ключ (используйте случайную строку)
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRES_IN=7d

# Порт сервера
PORT=5000

# Email настройки (опционально)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# CORS настройки (опционально)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Окружение
NODE_ENV=development

# Groq API (для AI-друга - бесплатный)
GROQ_API_KEY=your_groq_api_key_here
```

**Важно:** Замените `your_password` на ваш пароль PostgreSQL и `your_super_secret_jwt_key_here_change_this` на случайную строку.

### 2. Убедитесь, что PostgreSQL запущен

Проверьте, что PostgreSQL установлен и запущен на вашем компьютере.

### 3. Запустите бэкенд сервер

Откройте терминал в папке `lang-backend` и выполните:

```bash
npm run dev
```

Или:

```bash
npm start
```

### 4. Проверьте, что сервер запущен

Вы должны увидеть сообщение:
```
✅ Подключено к PostgreSQL
Сервер запущен на порту 5000
```

### 5. Проверьте в браузере

Откройте в браузере: `http://localhost:5000/health`

Должен вернуться JSON с `status: "ok"`

## Если возникают ошибки

### Ошибка подключения к БД
- Убедитесь, что PostgreSQL запущен
- Проверьте правильность данных в `.env` (DB_USER, DB_HOST, DB_NAME, DB_PASS, DB_PORT)
- Убедитесь, что база данных `lang_db` существует

### Порт 5000 занят
- Измените `PORT` в `.env` на другой порт (например, 5001)
- Обновите `API_URL` во фронтенде в файле `lang-frontend/src/api/index.js`

