# 🔒 Защита .env файлов от загрузки в GitHub

## ✅ Что уже сделано

В файле `.gitignore` уже добавлены правила для игнорирования `.env` файлов:
- `.env`
- `.env.*`
- `.env.local`
- `.env.development`
- `.env.production`
- `.env.test`
- `*.env`

## ⚠️ Важно: Если .env файлы уже были добавлены в Git

Если вы ранее добавили `.env` файлы в Git (до создания `.gitignore`), их нужно удалить из индекса:

### Шаг 1: Проверьте, есть ли .env файлы в Git

```bash
git ls-files | grep .env
```

### Шаг 2: Если файлы найдены, удалите их из индекса (но НЕ с диска)

```bash
git rm --cached lang-backend/.env
git rm --cached lang-frontend/.env
```

Или удалите все `.env` файлы сразу:
```bash
git rm --cached **/.env
git rm --cached **/.env.*
```

### Шаг 3: Добавьте изменения в .gitignore

```bash
git add .gitignore
```

### Шаг 4: Создайте коммит

```bash
git commit -m "Удалены .env файлы из репозитория, добавлены в .gitignore"
```

### Шаг 5: Загрузите изменения

```bash
git push origin master
```

## 📝 Создание примера .env файла

Рекомендуется создать файл `.env.example` с примером переменных (без реальных значений):

**lang-backend/.env.example:**
```env
# База данных PostgreSQL
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lang_db
DB_PASS=your_password_here
DB_PORT=5432

# JWT секретный ключ
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Порт сервера
PORT=5000

# Groq API (бесплатный)
GROQ_API_KEY=your_groq_api_key_here

# Email настройки (опционально)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# CORS настройки
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Окружение
NODE_ENV=development
```

Этот файл `.env.example` можно безопасно загружать в GitHub, так как он не содержит реальных секретов.

## 🔍 Проверка перед коммитом

Перед каждым коммитом проверяйте, что `.env` файлы не попадут:

```bash
git status
```

Если видите `.env` файлы в списке изменений, они НЕ должны быть там!

## 🛡️ Дополнительная защита

Если вы случайно загрузили `.env` файл в GitHub:

1. **Немедленно** измените все секретные ключи (API ключи, пароли и т.д.)
2. Удалите файл из истории Git (требует force push):
   ```bash
   git filter-branch --force --index-filter "git rm --cached --ignore-unmatch lang-backend/.env" --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```
   ⚠️ **ВНИМАНИЕ:** Это переписывает историю Git. Используйте только если действительно нужно.

## ✅ Итоговый чеклист

- [ ] `.gitignore` содержит правила для `.env` файлов
- [ ] `.env` файлы удалены из Git индекса (если были добавлены ранее)
- [ ] Создан `.env.example` файл с примерами
- [ ] Проверено, что `git status` не показывает `.env` файлы
- [ ] Все секретные ключи хранятся только локально

