import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveExercise from "../components/lesson/InteractiveExercise";
import FillInTheBlank from "../components/lesson/FillInTheBlank";
import FlashCards from "../components/lesson/FlashCards";
import PronunciationPractice from "../components/lesson/PronunciationPractice";
import Button from "../components/ui/Button";
import { progress, achievements, auth } from "../api";
import { toast } from "../components/Toast";

export default function Exercise() {
  const navigate = useNavigate();
  const location = useLocation();
  const { exercises, exerciseType, courseId, lessonId } = location.state || {};
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);

  useEffect(() => {
    // Если нет данных упражнений, вернуться назад
    if (!exercises || exercises.length === 0) {
      navigate(-1);
    }
  }, [exercises, navigate]);

  if (!exercises || exercises.length === 0) {
    return null;
  }

  const currentExercise = exercises[currentExerciseIndex];
  const progressPercent = ((currentExerciseIndex + 1) / exercises.length) * 100;
  const isLastExercise = currentExerciseIndex === exercises.length - 1;

  const handleExerciseComplete = () => {
    setCompletedExercises(new Set([...completedExercises, currentExerciseIndex]));
    
    if (!isLastExercise) {
      setTimeout(() => {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }, 1000);
    } else {
      setTimeout(() => {
        handleFinish();
      }, 1500);
    }
  };

  const handleNext = () => {
    if (!isLastExercise) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleFinish = async () => {
    // Если есть courseId и lessonId, автоматически завершаем урок
    if (courseId && lessonId) {
      setIsCompletingLesson(true);
      try {
        // Получаем данные пользователя
        const userData = await auth.getMe();
        if (!userData?.id) {
          toast.error("Жүйеге кіру қажет");
          navigate(-1);
          return;
        }

        // Сохраняем прогресс
        await progress.addProgress({
          course_id: parseInt(courseId),
          lesson_id: parseInt(lessonId),
          completed: true,
        });

        // Обновляем достижения
        await achievements.completeLesson(userData.id);

        toast.success("Сабақ аяқталды! +50 XP");
      } catch (err) {
        console.error("Сабақты аяқтау қатесі:", err);
        toast.error(err.message || "Сабақты аяқтау қатесі");
      } finally {
        setIsCompletingLesson(false);
      }
    }
    
    // Небольшая задержка перед возвратом, чтобы пользователь увидел сообщение
    setTimeout(() => {
      navigate(-1);
    }, 1000);
  };

  const renderExercise = () => {
    if (currentExercise.type === 'multiple-choice') {
      return (
        <InteractiveExercise
          exercise={currentExercise}
          onComplete={handleExerciseComplete}
        />
      );
    } else if (currentExercise.type === 'fill-blank') {
      return (
        <FillInTheBlank
          exercise={currentExercise}
          onComplete={handleExerciseComplete}
        />
      );
    } else if (currentExercise.type === 'flashcards') {
      return (
        <FlashCards
          cards={currentExercise.cards}
          onComplete={handleExerciseComplete}
        />
      );
    } else if (currentExercise.type === 'pronunciation') {
      return (
        <PronunciationPractice
          words={currentExercise.words}
          onComplete={handleExerciseComplete}
        />
      );
    }
    return null;
  };

  const getExerciseTitle = () => {
    if (currentExercise.type === 'multiple-choice') return 'Викторина';
    if (currentExercise.type === 'fill-blank') return 'Бос орынды толтыру';
    if (currentExercise.type === 'flashcards') return 'Жад карточкалары';
    if (currentExercise.type === 'pronunciation') return 'Айтылу';
    return 'Жаттығу';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900/40 via-primary-900/30 to-slate-900 flex flex-col">
      {/* Header с прогрессом */}
      <div className="bg-slate-800/90 backdrop-blur-md border-b border-brand-500/30 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-brand-700/40 hover:bg-brand-600/50 text-white transition-all duration-200 border border-brand-500/20"
                aria-label="Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-white">{getExerciseTitle()}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-400">Сұрақ</p>
                <p className="text-base font-semibold text-purple-300">
                  {currentExerciseIndex + 1} / {exercises.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">XP</p>
                <p className="text-base font-semibold text-yellow-400">50</p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-500 via-primary-500 to-brand-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold text-purple-300 min-w-[45px] text-right">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </div>
      </div>

      {/* Exercise Content */}
      <div className="flex-1 overflow-y-auto py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentExerciseIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderExercise()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-slate-800/90 backdrop-blur-md border-t border-brand-500/30 sticky bottom-0">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentExerciseIndex === 0}
                className="px-5 py-2.5 text-sm font-medium bg-purple-600/60 hover:bg-purple-600/80 text-white border-2 border-purple-400/50 hover:border-purple-400/70 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-600/60 transition-all"
              >
                ← Алдыңғы
              </Button>
              {completedExercises.has(currentExerciseIndex) ? (
                <span className="px-4 py-2 bg-green-800/50 text-green-300 rounded-lg text-sm font-medium border border-green-400/50">
                  ✓ Аяқталды
                </span>
              ) : (
                <span className="px-4 py-2 bg-orange-800/50 text-orange-300 rounded-lg text-sm font-medium border border-orange-400/50">
                  Жүргізілуде
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isLastExercise && (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!completedExercises.has(currentExerciseIndex)}
                  className="px-5 py-2.5 text-sm font-medium border border-purple-400/50 disabled:opacity-30"
                >
                  Келесі →
                </Button>
              )}
              {isLastExercise && completedExercises.has(currentExerciseIndex) && (
                <Button
                  variant="success"
                  onClick={handleFinish}
                  disabled={isCompletingLesson}
                  className="px-5 py-2.5 text-sm font-medium border border-green-400/50 disabled:opacity-50"
                >
                  {isCompletingLesson ? "Аяқталуда..." : "Аяқтау ✓"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

