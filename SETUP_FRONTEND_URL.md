# 🔗 Настройка Frontend URL для Email ссылок

## 📋 **Шаг 1: Добавьте переменную окружения в Backend**

Откройте файл `lang-backend/.env` и добавьте строку:

```env
FRONTEND_URL=https://monkey-attorneys-perfect-attempt.trycloudflare.com
```

⚠️ **Важно:** 
- Используйте ваш реальный frontend URL из Cloudflare Tunnel
- URL должен начинаться с `https://`
- Не добавляйте `/` в конце

---

## 📝 **Пример `.env` файла:**

```env
# ... другие переменные ...
PORT=5000
JWT_SECRET=your_secret_key
DATABASE_URL=your_database_url

# Frontend URL для email ссылок
FRONTEND_URL=https://monkey-attorneys-perfect-attempt.trycloudflare.com
```

---

## 🔄 **Шаг 2: Перезапустите Backend сервер**

```bash
cd lang-backend
# Нажмите Ctrl+C (если запущен)
npm run dev
```

---

## ✅ **Что изменилось:**

1. **Подтверждение email** (`/verify-email/:token`)
   - Ссылка в email: `https://monkey-attorneys-perfect-attempt.trycloudflare.com/verify-email/{token}`
   - После подтверждения автоматически перенаправляет на `/login`

2. **Сброс пароля** (`/reset-password/:token`)
   - Ссылка в email: `https://monkey-attorneys-perfect-attempt.trycloudflare.com/reset-password/{token}`
   - После сброса пароля автоматически перенаправляет на `/login`

---

## 🎯 **Страницы, которые используются:**

| Действие | URL | Редирект после |
|----------|-----|----------------|
| Подтверждение email | `/verify-email/:token` | `/login` (через 2 сек) |
| Сброс пароля | `/reset-password/:token` | `/login` (через 2.5 сек) |

---

## ⚠️ **Важно:**

Если вы перезапускаете Cloudflare Tunnel и получаете **новый frontend URL**, обновите `FRONTEND_URL` в `.env` и **перезапустите backend**!

---

## 🧪 **Проверка:**

1. Зарегистрируйте нового пользователя
2. Проверьте email — ссылка должна вести на Cloudflare Tunnel URL
3. Перейдите по ссылке — должно перенаправить на `/login`

---

**🎉 Готово! Теперь все email ссылки используют ваш Cloudflare Tunnel URL!**

