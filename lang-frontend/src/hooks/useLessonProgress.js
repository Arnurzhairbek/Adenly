import { useState } from "react";
import { auth, progress, achievements } from "../api";

export function useLessonProgress() {
  const [loading, setLoading] = useState(false);

  const completeLesson = async (lessonId, courseId) => {
    setLoading(true);
    try {
      // Получаем данные пользователя
      const userData = await auth.getMe();
      if (!userData?.id) throw new Error("Пайдаланушы авторизацияланбаған");

      // Сохраняем прогресс (user_id берется из токена автоматически)
      await progress.addProgress({
        course_id: courseId,
        lesson_id: lessonId,
        completed: true,
      });

      // Обновляем достижения
      await achievements.completeLesson(userData.id);

      return { success: true };
    } catch (err) {
      console.error("Сабақты аяқтау қатесі:", err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { completeLesson, loading };
}

