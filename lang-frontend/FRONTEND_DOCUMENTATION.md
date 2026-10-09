# 📚 Полная документация фронтенда Adenly

## 📋 Содержание

1. [Обзор проекта](#обзор-проекта)
2. [Технологический стек](#технологический-стек)
3. [Структура проекта](#структура-проекта)
4. [Архитектура приложения](#архитектура-приложения)
5. [Роутинг](#роутинг)
6. [API интеграция](#api-интеграция)
7. [Контексты и состояние](#контексты-и-состояние)
8. [Компоненты](#компоненты)
9. [Страницы](#страницы)
10. [Хуки](#хуки)
11. [Утилиты](#утилиты)
12. [Стилизация](#стилизация)
13. [Обработка ошибок](#обработка-ошибок)
14. [Запуск и разработка](#запуск-и-разработка)

---

## 🎯 Обзор проекта

**Adenly** — это современное веб-приложение для изучения языков, построенное на React. Приложение предоставляет интерактивные курсы, отслеживание прогресса, систему достижений и лидерборд.

### Основные возможности:
- 🔐 Аутентификация пользователей (регистрация, вход, восстановление пароля)
- 📚 Просмотр и изучение курсов
- 📖 Интерактивные уроки с различными типами упражнений
- 📊 Отслеживание прогресса обучения
- 🏆 Система достижений и уровней
- 🥇 Таблица лидеров
- 🔔 Система уведомлений
- 👤 Профиль пользователя

---

## 🛠 Технологический стек

### Основные технологии:
- **React 19.1.1** — библиотека для создания пользовательских интерфейсов
- **React Router DOM 7.9.3** — маршрутизация в одностраничном приложении
- **Vite 7.1.14** — быстрый сборщик и dev-сервер
- **Framer Motion 12.23.22** — библиотека для анимаций
- **Tailwind CSS 4.1.14** — utility-first CSS фреймворк

### Дополнительные инструменты:
- **ESLint** — линтер для JavaScript/React
- **PostCSS** — обработка CSS
- **Autoprefixer** — автоматическое добавление префиксов

---

## 📁 Структура проекта

```
lang-frontend/
├── public/                 # Статические файлы
│   └── vite.svg
├── src/
│   ├── api/               # API интеграция
│   │   └── index.js       # Все API методы
│   ├── assets/            # Ресурсы (изображения, иконки)
│   │   └── react.svg
│   ├── components/        # React компоненты
│   │   ├── lesson/        # Компоненты для уроков
│   │   │   ├── ExerciseModal.jsx
│   │   │   ├── ExerciseTabs.jsx
│   │   │   ├── FillInTheBlank.jsx
│   │   │   ├── FlashCards.jsx
│   │   │   ├── InteractiveExercise.jsx
│   │   │   └── PronunciationPractice.jsx
│   │   ├── ui/            # UI компоненты
│   │   │   ├── Badge.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Skeleton.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── Layout.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── MobileMenu.jsx
│   │   ├── ProgressChart.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── SearchBar.jsx
│   │   ├── ThemeToggle.jsx
│   │   └── Toast.jsx
│   ├── contexts/          # React Contexts
│   │   └── AuthContext.jsx
│   ├── hooks/             # Custom React Hooks
│   │   └── useLessonProgress.js
│   ├── pages/             # Страницы приложения
│   │   ├── Achievements.jsx
│   │   ├── Course.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── Home.jsx
│   │   ├── LeaderBoard.jsx
│   │   ├── Login.jsx
│   │   ├── Notifications.jsx
│   │   ├── Profile.jsx
│   │   ├── Progress.jsx
│   │   ├── Register.jsx
│   │   ├── ResetPassword.jsx
│   │   └── VerifyEmail.jsx
│   ├── utils/             # Утилиты
│   │   ├── cache.js
│   │   └── errorHandler.js
│   ├── App.jsx            # Главный компонент приложения
│   ├── App.css            # Стили приложения
│   ├── index.css          # Глобальные стили
│   └── main.jsx           # Точка входа
├── .eslintrc.js           # Конфигурация ESLint
├── index.html             # HTML шаблон
├── package.json           # Зависимости проекта
├── postcss.config.js      # Конфигурация PostCSS
├── tailwind.config.js     # Конфигурация Tailwind CSS
└── vite.config.js         # Конфигурация Vite
```

---

## 🏗 Архитектура приложения

### Точка входа (`main.jsx`)

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Устанавливаем темную тему по умолчанию
document.documentElement.classList.add("dark");
document.body.classList.add("dark-theme");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Главный компонент (`App.jsx`)

Приложение использует следующую структуру:

```
ErrorBoundary
  └── BrowserRouter
      └── AuthProvider
          └── ToastContainer
              └── Routes (все страницы)
```

**Особенности:**
- `ErrorBoundary` — перехватывает ошибки React
- `BrowserRouter` — обеспечивает маршрутизацию
- `AuthProvider` — управляет состоянием аутентификации
- `ToastContainer` — отображает уведомления

---

## 🗺 Роутинг

### Маршруты приложения

Все маршруты определены в `App.jsx`:

#### Публичные маршруты:
- `/` — Главная страница
- `/home` — Главная страница (алиас)
- `/login` — Страница входа
- `/register` — Страница регистрации
- `/forgot-password` — Восстановление пароля
- `/reset-password/:token` — Сброс пароля
- `/verify-email/:token` — Подтверждение email

#### Защищенные маршруты (требуют аутентификации):
- `/courses` — Список курсов
- `/progress` — Прогресс обучения
- `/achievements` — Достижения
- `/leaderboard` — Таблица лидеров
- `/notifications` — Уведомления
- `/profile` — Профиль пользователя

### Защита маршрутов

Компонент `ProtectedRoute` проверяет аутентификацию:

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

---

## 🔌 API интеграция

### Файл `src/api/index.js`

Централизованная система для работы с API бэкенда.

#### Базовая функция `apiRequest`

```javascript
async function apiRequest(endpoint, method = "GET", body = null, token = null, options = {})
```

**Параметры:**
- `endpoint` — путь API (например, `/auth/login`)
- `method` — HTTP метод (GET, POST, PUT, DELETE)
- `body` — тело запроса (объект)
- `token` — JWT токен (опционально, берется из localStorage)
- `options` — дополнительные опции:
  - `useCache` — использовать кэширование
  - `cacheKey` — ключ кэша
  - `retries` — количество повторов при ошибке
  - `retryDelay` — задержка между повторами

**Возможности:**
- ✅ Автоматическое добавление JWT токена
- ✅ Retry механизм для неудачных запросов
- ✅ Кэширование GET запросов
- ✅ Обработка ошибок (401, 429, 500)
- ✅ Логирование в режиме разработки

#### API методы

##### Аутентификация (`auth`)
```javascript
auth.register(userData)           // Регистрация
auth.login(email, password)       // Вход
auth.getMe()                      // Получить текущего пользователя
auth.verifyEmail(token)           // Подтвердить email
auth.forgotPassword(email)        // Забыли пароль
auth.resetPassword(token, newPassword) // Сброс пароля
```

##### Курсы (`courses`)
```javascript
courses.getAll()                  // Все курсы (с кэшированием)
courses.getById(id)               // Курс по ID
```

##### Уроки (`lessons`)
```javascript
lessons.getByCourse(courseId)     // Уроки курса
lessons.getById(id)               // Урок по ID
```

##### Прогресс (`progress`)
```javascript
progress.getByUser(userId)        // Прогресс пользователя
progress.getByCourse(userId, courseId) // Прогресс по курсу
progress.addProgress(progressData) // Добавить/обновить прогресс
```

##### Достижения (`achievements`)
```javascript
achievements.getByUser(userId)   // Достижения пользователя
achievements.addXP(userId, xp)   // Добавить XP
achievements.completeLesson(userId) // Завершить урок
```

##### Лидерборд (`leaderboard`)
```javascript
leaderboard.getAll()              // Таблица лидеров
```

##### Уведомления (`notifications`)
```javascript
notifications.getAll()             // Все уведомления
notifications.markAsRead(id)       // Отметить как прочитанное
notifications.create(data)         // Создать уведомление
```

### URL API

По умолчанию: `http://localhost:5000/api`

Можно изменить в `src/api/index.js`:
```javascript
const API_URL = "http://localhost:5000/api";
```

---

## 🎭 Контексты и состояние

### AuthContext (`src/contexts/AuthContext.jsx`)

Управляет состоянием аутентификации пользователя.

#### Состояние:
- `user` — объект текущего пользователя (null если не авторизован)
- `loading` — флаг загрузки

#### Методы:
- `login(email, password)` — вход в систему
- `logout()` — выход из системы
- `loadUser()` — загрузка данных пользователя

#### Использование:
```jsx
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { user, loading, login, logout } = useAuth();
  
  if (loading) return <div>Загрузка...</div>;
  if (!user) return <div>Не авторизован</div>;
  
  return <div>Привет, {user.name}!</div>;
}
```

---

## 🧩 Компоненты

### UI компоненты (`src/components/ui/`)

#### Button
Универсальная кнопка с различными вариантами.

**Пропсы:**
- `variant` — `"primary" | "secondary" | "success" | "danger" | "ghost"`
- `size` — `"sm" | "md" | "lg"`
- `loading` — показывать индикатор загрузки
- `disabled` — отключить кнопку

**Пример:**
```jsx
<Button variant="primary" size="md" loading={isLoading}>
  Отправить
</Button>
```

#### Card
Карточка с градиентным фоном и эффектами.

**Пропсы:**
- `hover` — эффект при наведении
- `onClick` — обработчик клика

**Пример:**
```jsx
<Card hover onClick={() => navigate("/course")}>
  <h3>Название курса</h3>
  <p>Описание</p>
</Card>
```

#### Input
Поле ввода с валидацией.

**Пропсы:**
- `type` — тип input
- `label` — метка
- `error` — сообщение об ошибке
- `required` — обязательное поле

#### Badge
Бейдж для отображения статусов и меток.

**Пропсы:**
- `variant` — `"info" | "success" | "warning" | "danger"`

#### Modal
Модальное окно.

#### Skeleton
Компонент для отображения состояния загрузки.

### Функциональные компоненты

#### Layout (`src/components/Layout.jsx`)
Общий макет приложения с навигацией и футером.

**Функции:**
- Навигационное меню
- Счетчик непрочитанных уведомлений
- Автоматическое обновление уведомлений каждые 30 секунд

#### ProtectedRoute (`src/components/ProtectedRoute.jsx`)
Защищает маршруты, требующие аутентификации.

#### ErrorBoundary (`src/components/ErrorBoundary.jsx`)
Перехватывает ошибки React и отображает fallback UI.

#### LoadingSpinner
Индикатор загрузки с различными размерами.

#### Toast (`src/components/Toast.jsx`)
Система уведомлений.

**Использование:**
```javascript
import { toast } from "../components/Toast";

toast.success("Успешно!");
toast.error("Ошибка!");
toast.info("Информация");
```

#### EmptyState
Отображается, когда нет данных.

#### ProgressChart
График прогресса обучения.

### Компоненты уроков (`src/components/lesson/`)

#### ExerciseModal
Модальное окно для упражнений.

#### ExerciseTabs
Вкладки с различными типами упражнений.

#### FillInTheBlank
Упражнение "Заполни пропуски".

#### FlashCards
Карточки для запоминания.

#### InteractiveExercise
Интерактивное упражнение.

#### PronunciationPractice
Упражнение на произношение.

---

## 📄 Страницы

### Home (`src/pages/Home.jsx`)

Главная страница с дашбордом.

**Функции:**
- Приветствие пользователя
- Статистика (XP, уровень, streak, уроки)
- Секция "Continue Learning" — продолжение обучения
- Список всех курсов
- Прогресс обучения
- Достижения
- Лидерборд (топ-5)
- Уведомления

**Загружаемые данные:**
- Информация о пользователе
- Все курсы
- Уроки для каждого курса
- Прогресс пользователя
- Достижения
- Лидерборд
- Уведомления

### Course (`src/pages/Course.jsx`)

Страница курса с уроками.

**Функции:**
- Отображение информации о курсе
- Список уроков
- Прогресс по курсу
- Фильтрация и поиск уроков
- Навигация к урокам

### Login (`src/pages/Login.jsx`)

Страница входа.

**Функции:**
- Валидация email и пароля
- Обработка ошибок
- Редирект после успешного входа

### Register (`src/pages/Register.jsx`)

Страница регистрации.

**Функции:**
- Регистрация нового пользователя
- Валидация данных
- Подтверждение email

### Progress (`src/pages/Progress.jsx`)

Страница прогресса обучения.

**Функции:**
- Общий прогресс
- Прогресс по каждому курсу
- Детальная статистика

### Achievements (`src/pages/Achievements.jsx`)

Страница достижений.

**Функции:**
- Текущий уровень
- Количество XP
- Завершенные уроки
- История достижений

### LeaderBoard (`src/pages/LeaderBoard.jsx`)

Таблица лидеров.

**Функции:**
- Топ пользователей
- Сортировка по различным критериям

### Notifications (`src/pages/Notifications.jsx`)

Страница уведомлений.

**Функции:**
- Список всех уведомлений
- Отметка как прочитанное
- Фильтрация по статусу

### Profile (`src/pages/Profile.jsx`)

Профиль пользователя.

**Функции:**
- Информация о пользователе
- Редактирование профиля
- Выход из системы

### ForgotPassword (`src/pages/ForgotPassword.jsx`)

Восстановление пароля.

### ResetPassword (`src/pages/ResetPassword.jsx`)

Сброс пароля по токену.

### VerifyEmail (`src/pages/VerifyEmail.jsx`)

Подтверждение email адреса.

---

## 🎣 Хуки

### useLessonProgress (`src/hooks/useLessonProgress.js`)

Кастомный хук для работы с прогрессом урока.

**Возвращает:**
- `completeLesson(lessonId, courseId)` — функция для завершения урока
- `loading` — состояние загрузки

**Пример:**
```jsx
import { useLessonProgress } from "../hooks/useLessonProgress";

function LessonComponent() {
  const { completeLesson, loading } = useLessonProgress();
  
  const handleComplete = async () => {
    const result = await completeLesson(lessonId, courseId);
    if (result.success) {
      toast.success("Урок завершен!");
    }
  };
}
```

---

## 🛠 Утилиты

### cache.js (`src/utils/cache.js`)

Система кэширования для API запросов.

**Функции:**
- `getCached(key)` — получить данные из кэша
- `setCache(key, data, ttl)` — сохранить в кэш
- `clearCache(key)` — очистить кэш
- `invalidateCache(pattern)` — инвалидировать по паттерну

**TTL по умолчанию:** 5 минут

### errorHandler.js (`src/utils/errorHandler.js`)

Централизованная обработка ошибок API.

**Функция:**
```javascript
handleApiError(error)
```

Обрабатывает различные типы ошибок:
- 401 — истекшая сессия
- 404 — ресурс не найден
- 500 — ошибка сервера
- Сетевые ошибки

---

## 🎨 Стилизация

### Tailwind CSS

Приложение использует Tailwind CSS 4.1.14 с кастомной конфигурацией.

#### Цветовая палитра

**Brand цвета:**
- `brand-50` до `brand-900` — основные цвета бренда (фиолетовый/индиго)

**Primary цвета:**
- `primary-50` до `primary-900` — синие оттенки

**Accent цвета:**
- `accent-blue`, `accent-purple`, `accent-green`, и т.д.

#### Кастомные классы

**Градиенты:**
- `bg-gradient-primary`
- `bg-gradient-secondary`
- `bg-gradient-accent`
- `bg-gradient-brand`

**Тени:**
- `shadow-soft`
- `shadow-medium`
- `shadow-large`

**Анимации:**
- `animate-fade-in`
- `animate-slide-up`
- `animate-scale-in`

### Глобальные стили (`src/index.css`)

- Темная тема по умолчанию
- Кастомные скроллбары
- Шрифт Inter
- Градиентный фон

### Framer Motion

Используется для плавных анимаций:

```jsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Контент
</motion.div>
```

---

## ⚠️ Обработка ошибок

### ErrorBoundary

Перехватывает ошибки React компонентов и отображает fallback UI.

**Особенности:**
- Показывает детали ошибки в режиме разработки
- Кнопка "Попробовать снова"
- Кнопка "Вернуться на главную"

### API ошибки

Обрабатываются в `apiRequest`:
- **401** — автоматическое удаление токена и редирект
- **429** — автоматический retry с задержкой
- **500** — retry с экспоненциальной задержкой
- **Сетевые ошибки** — логирование и информативное сообщение

### Валидация форм

Клиентская валидация на страницах Login и Register:
- Email формат
- Обязательные поля
- Минимальная длина пароля

---

## 🚀 Запуск и разработка

### Установка зависимостей

```bash
cd lang-frontend
npm install
```

### Запуск dev-сервера

```bash
npm run dev
# или
npm start
```

Приложение будет доступно на `http://localhost:5173`

### Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут в папке `dist/`

### Просмотр production сборки

```bash
npm run preview
```

### Линтинг

```bash
npm run lint
```

### Переменные окружения

Создайте файл `.env` в корне `lang-frontend`:

```env
VITE_API_URL=http://localhost:5000/api
```

Используйте в коде:
```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

---

## 📝 Примечания

### Токен аутентификации

JWT токен хранится в `localStorage` под ключом `"token"`.

### Кэширование

GET запросы к курсам кэшируются на 5 минут для улучшения производительности.

### Логирование

В режиме разработки (`NODE_ENV === 'development'`) все API запросы логируются в консоль.

### Адаптивность

Приложение адаптивно и работает на:
- Десктопах
- Планшетах
- Мобильных устройствах

### Браузерная поддержка

- Chrome (последние версии)
- Firefox (последние версии)
- Safari (последние версии)
- Edge (последние версии)

---

## 🔧 Конфигурация

### Vite (`vite.config.js`)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### Tailwind (`tailwind.config.js`)

Расширенная конфигурация с:
- Кастомными цветами
- Градиентами
- Анимациями
- Тенями

### ESLint (`eslint.config.js`)

Настроен для React с правилами:
- React Hooks
- React Refresh

---

## 📚 Дополнительные ресурсы

- [React документация](https://react.dev)
- [React Router документация](https://reactrouter.com)
- [Tailwind CSS документация](https://tailwindcss.com)
- [Framer Motion документация](https://www.framer.com/motion)
- [Vite документация](https://vitejs.dev)

---

## 🐛 Известные проблемы и решения

### Проблема: API запросы не выполняются

**Решение:** Убедитесь, что бэкенд запущен на `http://localhost:5000`

### Проблема: Ошибка CORS

**Решение:** Проверьте настройки CORS в бэкенде, добавьте `http://localhost:5173` в разрешенные источники

### Проблема: Токен не сохраняется

**Решение:** Проверьте, что `localStorage` доступен в браузере (не в режиме инкогнито)

---

## 📞 Поддержка

При возникновении проблем:
1. Проверьте консоль браузера (F12)
2. Проверьте Network tab в DevTools
3. Убедитесь, что бэкенд запущен
4. Проверьте файл `.env` с правильными настройками

---

**Версия документации:** 1.0.0  
**Последнее обновление:** 2024

