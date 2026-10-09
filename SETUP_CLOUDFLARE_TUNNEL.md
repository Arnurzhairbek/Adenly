# ☁️ Настройка Cloudflare Tunnel (cloudflared) для публичного доступа

## 📋 **Шаг 1: Установка cloudflared**

### **Вариант A: Через Chocolatey (Windows)**
```bash
choco install cloudflared
```

### **Вариант B: Скачать вручную**
1. Перейдите на: https://github.com/cloudflare/cloudflared/releases
2. Скачайте `cloudflared-windows-amd64.exe`
3. Переименуйте в `cloudflared.exe`
4. Добавьте в PATH или используйте полный путь

### **Вариант C: Через npm (если установлен)**
```bash
npm install -g cloudflared
```

---

## 🚀 **Шаг 2: Запуск туннелей**

### **Терминал 1 - Backend:**
```bash
cloudflared tunnel --url http://localhost:5000
```

Вы получите URL типа: `https://abc-xyz-123.trycloudflare.com`

📋 **Скопируйте этот URL!**

⚠️ **НЕ ЗАКРЫВАЙТЕ терминал!**

---

### **Терминал 2 - Frontend:**
```bash
cloudflared tunnel --url http://localhost:5173
```

Вы получите URL типа: `https://def-uvw-456.trycloudflare.com`

📋 **Скопируйте этот URL!** Это ваш публичный адрес сайта.

⚠️ **НЕ ЗАКРЫВАЙТЕ терминал!**

---

## 📝 **Шаг 3: Создайте `.env.local`**

В папке `lang-frontend` создайте файл `.env.local`:

```env
VITE_API_URL=https://abc-xyz-123.trycloudflare.com/api
```

⚠️ Замените на **реальный backend URL** из терминала 1! Не забудьте `/api`!

---

## 🔄 **Шаг 4: Перезапустите Frontend**

```bash
cd lang-frontend
npm run dev
```

---

## ✅ **Шаг 5: Откройте сайт**

Перейдите на frontend URL из терминала 2: `https://def-uvw-456.trycloudflare.com`

---

## ⚠️ **Важные заметки:**

1. **URL меняются** при каждом перезапуске cloudflared
   - Нужно обновлять `.env.local` каждый раз
   - Или использовать именованные туннели для постоянных URL (требует регистрации)

2. **Туннели работают** пока терминалы открыты

3. **Cloudflare Tunnel** более стабильный, чем ngrok (бесплатная версия)

---

## 🎯 **Для постоянных URL (опционально):**

Если нужны постоянные URL, зарегистрируйтесь на https://dash.cloudflare.com и создайте именованные туннели:

```bash
# Авторизация
cloudflared tunnel login

# Создание туннеля
cloudflared tunnel create my-backend
cloudflared tunnel create my-frontend

# Запуск туннелей
cloudflared tunnel --url http://localhost:5000 --name my-backend
cloudflared tunnel --url http://localhost:5173 --name my-frontend
```

---

## 🆘 **Решение проблем:**

### Проблема: "cloudflared: command not found"
✅ **Решение:** Убедитесь, что cloudflared установлен и добавлен в PATH

### Проблема: "Connection refused"
✅ **Решение:** Проверьте, что оба сервера (backend и frontend) запущены

### Проблема: "404 ошибка"
✅ **Решение:** Проверьте `.env.local` - должен быть правильный backend URL с `/api`

---

**🎉 Готово! Теперь ваш сайт доступен через Cloudflare Tunnel!**

