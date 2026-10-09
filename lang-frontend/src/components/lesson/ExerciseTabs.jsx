import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

export default function ExerciseTabs({ exercises, courseId, lessonId }) {
  const navigate = useNavigate();

  if (!exercises || exercises.length === 0) return null;

  // Группируем упражнения по типам
  const exerciseGroups = {
    'multiple-choice': exercises.filter(e => e.type === 'multiple-choice'),
    'fill-blank': exercises.filter(e => e.type === 'fill-blank'),
    'flashcards': exercises.filter(e => e.type === 'flashcards'),
    'pronunciation': exercises.filter(e => e.type === 'pronunciation'),
  };

  // Создаем табы только для тех типов, которые есть
  const tabs = [];
  if (exerciseGroups['multiple-choice'].length > 0) {
    tabs.push({ id: 'multiple-choice', label: 'Викторина', icon: null, count: exerciseGroups['multiple-choice'].length });
  }
  if (exerciseGroups['fill-blank'].length > 0) {
    tabs.push({ id: 'fill-blank', label: 'Бос орынды толтыру', icon: null, count: exerciseGroups['fill-blank'].length });
  }
  if (exerciseGroups['flashcards'].length > 0) {
    tabs.push({ id: 'flashcards', label: 'Жад карточкалары', icon: null, count: exerciseGroups['flashcards'].length });
  }
  if (exerciseGroups['pronunciation'].length > 0) {
    tabs.push({ id: 'pronunciation', label: 'Айтылу', icon: null, count: exerciseGroups['pronunciation'].length });
  }

  if (tabs.length === 0) return null;

  const handleStartExercise = (exerciseType) => {
    const selectedExercises = exerciseGroups[exerciseType] || [];
    if (selectedExercises.length > 0) {
      navigate('/exercise', {
        state: {
          exercises: selectedExercises,
          exerciseType: exerciseType,
          courseId: courseId,
          lessonId: lessonId
        }
      });
    }
  };

  return (
    <div className="pl-6 mb-8">
      <div className="bg-gradient-to-br from-brand-700/80 via-brand-600/60 to-primary-600/40 rounded-2xl p-8 border-2 border-brand-400/50 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
              Жаттығулар
            </h4>
            <p className="text-lg text-gray-200 mb-6">
              Біліміңізді интерактивті жаттығулармен тексеріңіз
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className="flex items-center gap-3 px-5 py-3 bg-brand-600/50 rounded-xl border-2 border-brand-400/40 shadow-md backdrop-blur-sm"
                >
                  <span className="text-lg font-semibold text-white">{tab.label}</span>
                  {tab.count > 1 && (
                    <span className="px-3 py-1 bg-brand-500/50 text-brand-100 rounded-full text-sm font-bold">
                      {tab.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 ml-6">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="primary"
                onClick={() => handleStartExercise(tab.id)}
                className="flex-shrink-0 px-8 py-4 text-lg font-semibold whitespace-nowrap"
              >
                {tab.label} бастау
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

