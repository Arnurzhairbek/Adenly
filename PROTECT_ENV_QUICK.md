# 🚀 Быстрая инструкция: Защита .env файлов

## ✅ Что уже сделано

1. ✅ Обновлен `.gitignore` - теперь игнорирует все `.env` файлы
2. ✅ Создан `lang-backend/.env.example` - пример файла для разработчиков

## 🔍 Проверка перед загрузкой в GitHub

### 1. Проверьте, не были ли .env файлы уже добавлены в Git:

```bash
git ls-files | grep .env
```

Если команда ничего не выводит - отлично! `.env` файлы не в Git.

### 2. Если файлы найдены, удалите их из индекса:

```bash
git rm --cached lang-backend/.env
git rm --cached lang-frontend/.env
```

### 3. Проверьте статус:

```bash
git status
```

Убедитесь, что `.env` файлы НЕ в списке изменений.

### 4. Добавьте .gitignore и .env.example:

```bash
git add .gitignore
git add lang-backend/.env.example
git commit -m "Добавлен .gitignore и .env.example для защиты секретов"
```

## ⚠️ Важно

- ❌ **НИКОГДА** не коммитьте реальные `.env` файлы
- ✅ Используйте `.env.example` как шаблон
- ✅ Копируйте `.env.example` в `.env` локально и заполните реальными значениями
- ✅ `.env` файл должен быть только на вашем компьютере

## 📝 Что делать при клонировании проекта

1. Скопируйте `.env.example` в `.env`:
   ```bash
   cp lang-backend/.env.example lang-backend/.env
   ```

2. Откройте `.env` и заполните реальными значениями

3. Никогда не коммитьте `.env` файл!

