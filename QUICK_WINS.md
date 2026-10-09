# ⚡ Быстрые улучшения (Quick Wins)

## 1. Добавить кнопку "Завершить урок" на странице Course

```jsx
// В lang-frontend/src/pages/Course.jsx
import { useLessonProgress } from "../hooks/useLessonProgress";
import { useAuth } from "../contexts/AuthContext";

// Внутри компонента Course:
const { completeLesson, loading: progressLoading } = useLessonProgress();
const { user } = useAuth();

const handleCompleteLesson = async (lessonId) => {
  const result = await completeLesson(lessonId, selectedCourse.id);
  if (result.success) {
    alert("✅ Урок завершен! Очки опыта добавлены.");
    // Обновить список уроков или показать визуальное подтверждение
  } else {
    alert("Ошибка: " + result.error);
  }
};

// В рендере урока добавить кнопку:
<button
  onClick={() => handleCompleteLesson(lesson.id)}
  disabled={progressLoading}
  className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg"
>
  {progressLoading ? "Загрузка..." : "✅ Завершить урок"}
</button>
```

---

## 2. Добавить Toast уведомления (react-hot-toast)

```bash
npm install react-hot-toast
```

```jsx
// В main.jsx
import { Toaster } from "react-hot-toast";

// В App.jsx добавить:
<Toaster position="top-right" />

// Использование:
import toast from "react-hot-toast";

// При успехе:
toast.success("Урок завершен! +50 XP");

// При ошибке:
toast.error("Ошибка загрузки данных");
```

---

## 3. Улучшить страницу Course с индикаторами прогресса

```jsx
// Получить прогресс для уроков
const [lessonsProgress, setLessonsProgress] = useState({});

useEffect(() => {
  if (user?.id && courseId) {
    progress.getByCourse(user.id, courseId).then(data => {
      const progressMap = {};
      data.forEach(p => {
        progressMap[p.lesson_id] = p.completed;
      });
      setLessonsProgress(progressMap);
    });
  }
}, [user, courseId]);

// В рендере урока:
<div className="flex items-center justify-between">
  <span className={lessonsProgress[lesson.id] ? "line-through opacity-50" : ""}>
    {lesson.title}
  </span>
  {lessonsProgress[lesson.id] && (
    <span className="text-green-400">✅ Завершен</span>
  )}
</div>
```

---

## 4. Счетчик непрочитанных уведомлений в Layout

```jsx
// В Layout.jsx
import { useEffect, useState } from "react";
import { notifications } from "../api";
import { useAuth } from "../contexts/AuthContext";

const { user } = useAuth();
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  if (user) {
    notifications.getAll().then(data => {
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    });
  }
}, [user]);

// В навигации:
<button onClick={() => navigate("/notifications")}>
  Уведомления {unreadCount > 0 && (
    <span className="ml-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
      {unreadCount}
    </span>
  )}
</button>
```

---

## 5. Skeleton Loader вместо "Загрузка..."

```jsx
// LoadingSpinner.jsx уже создан
// Создать SkeletonCard.jsx:

export default function SkeletonCard() {
  return (
    <div className="bg-white/10 rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-white/20 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-white/20 rounded w-1/2"></div>
    </div>
  );
}

// Использование:
{loading ? (
  <div className="grid md:grid-cols-3 gap-6">
    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
  </div>
) : (
  // обычный контент
)}
```

---

## 6. Подтверждение выхода

```jsx
// В Layout.jsx
const handleLogout = () => {
  if (window.confirm("Вы уверены, что хотите выйти?")) {
    logout();
  }
};
```

---

## 7. Фильтр прогресса

```jsx
// В Progress.jsx
const [filter, setFilter] = useState("all"); // all, completed, pending

const filteredProgress = progressData.filter(p => {
  if (filter === "completed") return p.completed;
  if (filter === "pending") return !p.completed;
  return true;
});

// UI:
<div className="flex gap-4 mb-4">
  <button onClick={() => setFilter("all")}>Все</button>
  <button onClick={() => setFilter("completed")}>Завершенные</button>
  <button onClick={() => setFilter("pending")}>В процессе</button>
</div>
```

---

## 8. Защита роутов на бэкенде

```jsx
// В lang-backend/routes/progress.js
// Изменить:
router.get("/user/:user_id", async (req, res) => {

// На:
router.get("/user/:user_id", authMiddleware, async (req, res) => {
  // Проверить, что пользователь запрашивает свой прогресс
  if (req.user.id !== parseInt(req.params.user_id)) {
    return res.status(403).json({ message: "Нет доступа" });
  }
  // ... остальной код
});
```

---

## 9. Валидация форм (простая, без библиотек)

```jsx
// В Register.jsx
const validateForm = () => {
  if (!email.includes("@")) {
    setError("Некорректный email");
    return false;
  }
  if (password.length < 6) {
    setError("Пароль должен быть минимум 6 символов");
    return false;
  }
  return true;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  // ... остальной код
};
```

---

## 10. Оптимистичные обновления для уведомлений

```jsx
// В Notifications.jsx
const handleMarkAsRead = async (id) => {
  // Оптимистично обновляем UI
  setNotes(notes.map(n => n.id === id ? { ...n, is_read: true } : n));
  
  try {
    await notifications.markAsRead(id);
  } catch (err) {
    // Откатываем изменение при ошибке
    setNotes(notes);
    alert("Ошибка обновления уведомления");
  }
};
```

