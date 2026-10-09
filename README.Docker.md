# 🐳 Docker Setup Guide

Этот проект настроен для работы с Docker и Docker Compose, что упрощает развертывание и разработку.

## 📋 Требования

- [Docker](https://www.docker.com/get-started) (версия 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (версия 2.0+)

## 🚀 Быстрый старт

### 1. Настройка переменных окружения

Скопируйте файл `.env.example` в `.env` и при необходимости измените значения:

```bash
cp .env.example .env
```

Отредактируйте `.env` файл:
- Измените `JWT_SECRET` на безопасный случайный ключ
- Настройте пароль PostgreSQL в `DB_PASS`
- При необходимости настройте email параметры
- Установите `VITE_API_URL` в зависимости от вашего окружения

### 2. Запуск всех сервисов

```bash
docker-compose up -d
```

Эта команда:
- Создаст и запустит PostgreSQL контейнер
- Соберёт и запустит backend контейнер
- Соберёт и запустит frontend контейнер
- Настроит сеть между всеми сервисами

### 3. Проверка статуса

```bash
docker-compose ps
```

Все сервисы должны быть в статусе `Up` и `healthy`.

### 4. Просмотр логов

Просмотр всех логов:
```bash
docker-compose logs -f
```

Логи конкретного сервиса:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## 🔧 Использование

### Доступ к приложению

- **Frontend**: http://localhost:80 (или порт, указанный в `FRONTEND_PORT`)
- **Backend API**: http://localhost:5000/api
- **PostgreSQL**: localhost:5432 (порт из `.env`)

### Остановка сервисов

```bash
docker-compose stop
```

### Полная остановка и удаление контейнеров

```bash
docker-compose down
```

### Удаление контейнеров и volumes (⚠️ удалит данные БД)

```bash
docker-compose down -v
```

## 🛠️ Разработка

### Пересборка образов после изменений

```bash
docker-compose build
docker-compose up -d
```

Или одной командой:
```bash
docker-compose up -d --build
```

### Запуск только базы данных для локальной разработки

```bash
docker-compose up -d postgres
```

Затем запускайте backend и frontend локально с помощью npm.

## 📁 Структура Docker файлов

```
project1/
├── docker-compose.yml          # Основной файл оркестрации
├── .env.example                # Пример переменных окружения
├── lang-backend/
│   ├── Dockerfile              # Backend образ
│   └── .dockerignore           # Исключения для backend
└── lang-frontend/
    ├── Dockerfile              # Frontend образ
    ├── nginx.conf              # Конфигурация nginx
    └── .dockerignore           # Исключения для frontend
```

## 🔍 Отладка

### Проверка подключения к базе данных

```bash
docker-compose exec backend node -e "require('./db/db').query('SELECT NOW()').then(r => console.log(r.rows))"
```

### Подключение к PostgreSQL контейнеру

```bash
docker-compose exec postgres psql -U postgres -d lang_db
```

### Проверка healthcheck

```bash
# Backend
curl http://localhost:5000/health

# Frontend
curl http://localhost:80
```

### Выполнение команд внутри контейнера

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh
```

## 🔐 Безопасность

### Production настройки

Перед развертыванием в production:

1. **Измените все пароли** в `.env` файле
2. **Используйте сильный JWT_SECRET** (минимум 32 символа)
3. **Настройте HTTPS** через reverse proxy (nginx/traefik)
4. **Ограничьте ALLOWED_ORIGINS** только вашими доменами
5. **Используйте secrets** для паролей вместо `.env` файлов
6. **Регулярно обновляйте** базовые образы

### Использование Docker Secrets

Для production рекомендуется использовать Docker Secrets:

```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

## 📊 Мониторинг

### Использование ресурсов

```bash
docker stats
```

### Проверка логов ошибок

```bash
docker-compose logs | grep -i error
```

## 🔄 Обновление

1. Получите последние изменения из репозитория
2. Пересоберите образы:
   ```bash
   docker-compose build --no-cache
   ```
3. Перезапустите сервисы:
   ```bash
   docker-compose up -d
   ```

## ❓ Часто задаваемые вопросы

### Почему frontend не подключается к backend?

Убедитесь, что `VITE_API_URL` в `.env` правильный. При сборке frontend этот URL встраивается в код.

### Как изменить порты?

Измените значения в `.env` файле:
- `DB_PORT` - порт PostgreSQL
- `FRONTEND_PORT` - порт frontend (по умолчанию маппится на 80)
- Backend порт можно изменить в `docker-compose.yml` (строки с `ports`)

### Как сбросить базу данных?

```bash
docker-compose down -v
docker-compose up -d
```

⚠️ Это удалит все данные!

### Проблемы с правами доступа на Linux

Если возникают проблемы с правами доступа к volumes:

```bash
sudo chown -R $USER:$USER lang-backend/uploads
```

## 📝 Примечания

- Volumes сохраняют данные между перезапусками контейнеров
- `postgres_data` volume содержит данные PostgreSQL
- `lang-backend/uploads` монтируется как volume для сохранения загруженных файлов
- Все сервисы находятся в одной Docker сети `lang_network`

