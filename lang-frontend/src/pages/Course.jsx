import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { courses, lessons, progress, achievements, auth, tests } from "../api";
import { toast } from "../components/Toast";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import { SkeletonList } from "../components/ui/Skeleton";
import ExerciseTabs from "../components/lesson/ExerciseTabs";
import LessonContent from "../components/lesson/LessonContent";
import { translateCourseTitle, translateCourseDescription, translateLanguage } from "../utils/translator";
import { 
  Chip as MUIChip, 
  Paper, 
  Typography, 
  Box, 
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Card as MUICard,
  CardContent,
  CardMedia,
  CardActionArea
} from "@mui/material";
import { 
  ExpandMore, 
  CheckCircle, 
  Pending, 
  Book, 
  Language,
  TrendingUp
} from "@mui/icons-material";

export default function Course() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get("courseId");
  
  // Функция для генерации интерактивных упражнений из контента урока
  const generateExercises = (lesson) => {
    const exercises = [];
    const content = lesson.content || '';
    
    // Извлекаем слова из списков для создания упражнений
    const wordPairs = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.trim().startsWith('-') && line.includes(' - ')) {
        const parts = line.replace('-', '').trim().split(' - ');
        if (parts.length === 2) {
          wordPairs.push({
            word: parts[0].trim(),
            translation: parts[1].trim()
          });
        }
      }
    });
    
    // Создаем упражнения только если есть слова
    if (wordPairs.length > 0) {
      // 1. Интерактивное упражнение (выбор правильного ответа) - создаем 2-3 вопроса
      if (wordPairs.length >= 3) {
        const selectedPairs = wordPairs.slice(0, Math.min(3, wordPairs.length));
        selectedPairs.forEach(pair => {
          const wrongOptions = wordPairs
            .filter(p => p.word !== pair.word)
            .slice(0, 2)
            .map(p => p.translation);
          
          exercises.push({
            type: 'multiple-choice',
            question: `"${pair.word}" деген не?`,
            options: [pair.translation, ...wrongOptions].sort(() => Math.random() - 0.5),
            correctAnswer: pair.translation,
            explanation: `"${pair.word}" дегеніміз "${pair.translation}"`
          });
        });
      }
      
      // 2. Карточки для запоминания (все слова из урока)
      if (wordPairs.length >= 2) {
        exercises.push({
          type: 'flashcards',
          cards: wordPairs.map(pair => ({
            front: pair.word,
            back: pair.translation
          }))
        });
      }
      
      // 3. Практика произношения (все слова из урока)
      if (wordPairs.length >= 2) {
        exercises.push({
          type: 'pronunciation',
          words: wordPairs.map(pair => ({
            word: pair.word,
            translation: pair.translation,
            lang: selectedCourse?.language === 'English' || selectedCourse?.language === 'Английский' || selectedCourse?.language === 'Ағылшын' ? 'en-US' : 
                  selectedCourse?.language === 'Spanish' || selectedCourse?.language === 'Испанский' ? 'es-ES' :
                  selectedCourse?.language === 'French' || selectedCourse?.language === 'Французский' ? 'fr-FR' :
                  selectedCourse?.language === 'German' || selectedCourse?.language === 'Немецкий' ? 'de-DE' :
                  'en-US'
          }))
        });
      }
      
      // 4. Заполнение пропусков (если есть примеры предложений)
      const exampleLines = lines.filter(line => 
        line.includes(' - ') && !line.trim().startsWith('-') && 
        (line.includes('I ') || line.includes('You ') || line.includes('He ') || line.includes('She ') || 
         line.includes('We ') || line.includes('They ') || line.includes('It '))
      );
      
      if (exampleLines.length > 0) {
        exampleLines.slice(0, 2).forEach(example => {
          const parts = example.split(' - ');
          if (parts.length === 2) {
            const sentence = parts[0].trim();
            
            // Находим ключевое слово для замены
            const keyWord = wordPairs.find(p => sentence.includes(p.word));
            if (keyWord) {
              const blankedSentence = sentence.replace(keyWord.word, '___1___');
              exercises.push({
                type: 'fill-blank',
                text: blankedSentence,
                blanks: [{
                  correct: keyWord.word,
                  hint: keyWord.translation
                }]
              });
            }
          }
        });
      }
    }
    
    return exercises;
  };
  
  // Функция для получения изображения курса
  const getCourseImage = (course) => {
    // Если есть изображение, используем его
    if (course.image_url) {
      return `http://localhost:5000${course.image_url}`;
    }
    
    // Генерируем изображение на основе языка курса
    const language = (course.language || course.language_to || 'language').toLowerCase();
    const languageImages = {
      'english': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
      'английский': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
      'ағылшын': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
      'spanish': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'испанский': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'испан': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'french': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
      'французский': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
      'француз': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
      'german': 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop',
      'немецкий': 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop',
      'неміс': 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop',
      'italian': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=300&fit=crop',
      'итальянский': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=300&fit=crop',
      'италиян': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=300&fit=crop',
      'chinese': 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop',
      'китайский': 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop',
      'қытай': 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop',
      'japanese': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop',
      'японский': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop',
      'жапон': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop',
      'russian': 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=300&fit=crop',
      'русский': 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=300&fit=crop',
      'орыс': 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=300&fit=crop',
    };
    
    // Если язык найден, используем соответствующее изображение
    if (languageImages[language]) {
      return languageImages[language];
    }
    
    // Иначе используем общее изображение для изучения языков
    return `https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop&q=80`;
  };
  
  const [coursesList, setCoursesList] = useState([]);
  const [lessonsList, setLessonsList] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [progressData, setProgressData] = useState({});
  const [courseProgressMap, setCourseProgressMap] = useState({}); // { courseId: { completed, total } }
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingLesson, setCompletingLesson] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [courseTests, setCourseTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);

  // Функция для загрузки прогресса
  const loadProgress = useCallback(async (userId, courseIdParam = null) => {
    if (!userId) return;
    
    try {
      // Загружаем весь прогресс пользователя для всех курсов
      const allProgressRes = await progress.getByUser(userId);
      const allProgressArray = Array.isArray(allProgressRes) 
        ? allProgressRes 
        : (allProgressRes?.data ? allProgressRes.data : []);
      
      // Создаем карту прогресса по курсам
      const courseProgress = {};
      const lessonProgress = {};
      
      allProgressArray.forEach(p => {
        if (p && p.lesson_id) {
          lessonProgress[p.lesson_id] = p.completed;
          if (p.course_id) {
            if (!courseProgress[p.course_id]) {
              courseProgress[p.course_id] = { completed: 0, total: 0 };
            }
            courseProgress[p.course_id].total++;
            if (p.completed) {
              courseProgress[p.course_id].completed++;
            }
          }
        }
      });
      
      setProgressData(lessonProgress);
      setCourseProgressMap(courseProgress);
      
      // Если есть выбранный курс, загружаем его прогресс отдельно
      if (courseIdParam) {
        const progressRes = await progress.getByCourse(userId, courseIdParam);
        const progressArray = Array.isArray(progressRes) 
          ? progressRes 
          : (progressRes?.data ? progressRes.data : []);
        const progressMap = {};
        progressArray.forEach(p => {
          if (p && p.lesson_id) {
            progressMap[p.lesson_id] = p.completed;
          }
        });
        setProgressData(progressMap);
      }
    } catch (err) {
      console.warn("Прогресті жүктеу қатесі:", err);
    }
  }, []);

  // Получаем данные пользователя и прогресс
  useEffect(() => {
    let isMounted = true;
    const loadUserData = async () => {
      try {
        const userData = await auth.getMe();
        if (!isMounted) return;
        setUser(userData);
        
        if (userData?.id) {
          await loadProgress(userData.id, courseId);
        }
      } catch (err) {
        // Игнорируем ошибки 429 (rate limit) в dev режиме
        if (err.message?.includes('429') || err.message?.includes('слишком много') || err.message?.includes('Тым көп')) {
          console.warn("Rate limit - пайдаланушы сұрауын өткізіп жіберу");
        } else {
          console.error("Пайдаланушыны жүктеу қатесі:", err);
        }
      }
    };
    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // Обновляем прогресс при возврате на страницу (когда страница становится видимой)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        loadProgress(user.id, courseId);
      }
    };

    const handleFocus = () => {
      if (user?.id) {
        loadProgress(user.id, courseId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, courseId, loadProgress]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const coursesData = await courses.getAll();
        if (!isMounted) return;
        setCoursesList(coursesData || []);
        
        if (courseId) {
          const course = coursesData.find(c => c.id === parseInt(courseId));
          if (course) {
            setSelectedCourse(course);
            const lessonsData = await lessons.getByCourse(courseId);
            if (!isMounted) return;
            setLessonsList(lessonsData || []);
            
            // Загружаем тесты для курса
            try {
              setLoadingTests(true);
              const testsData = await tests.getByCourse(courseId);
              if (!isMounted) return;
              console.log("Загружены тесты для курса:", testsData);
              setCourseTests(testsData || []);
            } catch (err) {
              console.error("Тесттерді жүктеу қатесі:", err);
              setCourseTests([]);
            } finally {
              if (isMounted) {
                setLoadingTests(false);
              }
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const handleCompleteLesson = async (lessonId) => {
    if (!user?.id) {
      toast.error("Жүйеге кіру қажет");
      navigate("/login");
      return;
    }

    setCompletingLesson(lessonId);
    try {
      // Сохраняем прогресс
      await progress.addProgress({
        course_id: parseInt(courseId),
        lesson_id: lessonId,
        completed: true,
      });

      // Обновляем достижения
      await achievements.completeLesson(user.id);

      // Обновляем локальное состояние
      setProgressData(prev => ({ ...prev, [lessonId]: true }));

      // Обновляем прогресс с сервера для синхронизации
      await loadProgress(user.id, courseId);

      toast.success("Сабақ аяқталды! +50 XP");
    } catch (err) {
      toast.error(err.message || "Сабақты аяқтау қатесі");
    } finally {
      setCompletingLesson(null);
    }
  };

  // Іздеу сұрауы бойынша курстарды сүзгілеу
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return coursesList;
    const query = searchQuery.toLowerCase();
    return coursesList.filter(course => 
      course.title?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||
      course.language?.toLowerCase().includes(query)
    );
  }, [coursesList, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6 text-white">
        <div className="max-w-6xl mx-auto">
          <SkeletonList count={6} />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <Card className="text-center bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
          <p className="text-red-300 text-xl font-semibold">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Жаңарту
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        {!courseId ? (
          <>
            <motion.h1 
              className="text-5xl font-bold mb-10 text-center text-white"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Курстар
            </motion.h1>
            
            <div className="mb-8">
              <SearchBar
                placeholder="Курстар бойынша іздеу..."
                onSearch={setSearchQuery}
                debounceMs={300}
              />
              {searchQuery && (
                <p className="text-purple-200 mt-4 text-center">
                  Табылған курстар: {filteredCourses.length}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover onClick={() => navigate(`/courses?courseId=${course.id}`)}>
                    <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                      <img 
                        src={getCourseImage(course)} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <h2 className="font-bold text-2xl text-white mb-3 hover:text-purple-300 transition-colors">{translateCourseTitle(course.title)}</h2>
                    <p className="text-purple-200 mb-4 line-clamp-3 leading-relaxed">{translateCourseDescription(course.description)}</p>
                    
                    {/* Курс прогрессі */}
                    {user && courseProgressMap[course.id] && courseProgressMap[course.id].total > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-purple-200">
                            Прогресс: {courseProgressMap[course.id].completed} / {courseProgressMap[course.id].total}
                          </span>
                          <span className="text-purple-300 font-semibold">
                            {Math.round((courseProgressMap[course.id].completed / courseProgressMap[course.id].total) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-purple-900/50 rounded-full h-2.5 overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-brand-600 rounded-full transition-all duration-500 shadow-sm"
                            style={{
                              width: `${(courseProgressMap[course.id].completed / courseProgressMap[course.id].total) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {(course.language || course.language_to) && (
                        <Badge variant="info">{translateLanguage(course.language || course.language_to)}</Badge>
                      )}
                      <span className="text-purple-200 text-sm">
                        {lessonsList.filter(l => l.course_id === course.id).length || 0} сабақ
                      </span>
                    </div>
                  </Card>
                </motion.div>
                ))
              ) : (
                <div className="col-span-full">
                  <Card className="text-center">
                    <p className="text-white/70 text-lg">
                      {searchQuery ? "Сіздің сұрауыңыз бойынша ештеңе табылмады" : "Курстар әлі қолжетімсіз"}
                    </p>
                  </Card>
                </div>
              )}
            </div>
          </>
        ) : selectedCourse ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                variant="ghost"
                onClick={() => navigate("/courses")}
                className="mb-6 hover:bg-brand-50"
              >
                ← Курстарға оралу
              </Button>
              
              <div className="mb-10">
                {/* Заголовок курса с изображением */}
                <div className="relative mb-8 rounded-2xl overflow-hidden shadow-xl">
                  <div className="relative h-64 bg-gradient-to-br from-brand-500 via-brand-600 to-primary-600">
                    <img 
                      src={getCourseImage(selectedCourse)} 
                      alt={selectedCourse.title}
                      className="w-full h-full object-cover opacity-80"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                      <h1 className="text-5xl font-bold mb-3 drop-shadow-lg">{translateCourseTitle(selectedCourse.title)}</h1>
                      <p className="text-xl text-white/90 mb-4 drop-shadow-md max-w-3xl">
                        {translateCourseDescription(selectedCourse.description)}
                      </p>
                      <div className="flex gap-3 mb-4">
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/course-review?courseId=${courseId}`)}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        >
                          Курсты бағалау
                        </Button>
                      </div>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                        {selectedCourse.language && (
                          <MUIChip
                            icon={<Language />}
                            label={translateLanguage(selectedCourse.language)}
                            sx={{
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)',
                              color: 'white',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              fontSize: '1rem',
                              height: '36px',
                              fontWeight: 500
                            }}
                          />
                        )}
                        <MUIChip
                          icon={<Book />}
                          label={`${lessonsList.length} сабақ`}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            fontSize: '1rem',
                            height: '36px',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    </div>
                  </div>
                </div>
                
                {/* Курс прогрессі */}
                {user && lessonsList.length > 0 && (
                  <Card className="mb-8 bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Курс прогрессі</h3>
                        <p className="text-sm text-purple-200">
                          Жетістіктерді ашу үшін оқуды жалғастырыңыз
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-purple-300">
                          {Object.values(progressData).filter(Boolean).length}
                        </span>
                        <span className="text-xl text-purple-200"> / {lessonsList.length}</span>
                      </div>
                    </div>
                    <Box sx={{ width: '100%', mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={lessonsList.length > 0 ? (Object.values(progressData).filter(Boolean).length / lessonsList.length) * 100 : 0}
                        sx={{
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">
                        {lessonsList.length > 0 
                          ? `${Math.round((Object.values(progressData).filter(Boolean).length / lessonsList.length) * 100)}% Аяқталды`
                          : '0% Аяқталды'
                        }
                      </p>
                      <p className="text-sm text-purple-200">
                        {lessonsList.length - Object.values(progressData).filter(Boolean).length} сабақ қалды
                      </p>
                    </div>
                  </Card>
                )}
              </div>
              
              <div className="mb-8">
                <h2 className="text-4xl font-bold mb-3 text-white">Курс сабақтары</h2>
                <p className="text-lg text-purple-200">Прогрессіңізді бақылау үшін сабақтарды аяқтаңыз</p>
              </div>
              
              {lessonsList.length > 0 ? (
                <div className="space-y-6">
                  {lessonsList.map((lesson, index) => {
                    const isCompleted = progressData[lesson.id];
                    const lessonNumber = index + 1;
                    const totalLessons = lessonsList.length;
                    const progressPercent = ((lessonNumber - 1) / totalLessons) * 100;
                    
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <Card 
                          className={`
                            relative overflow-hidden
                            ${isCompleted 
                              ? "border-2 border-green-400 bg-green-500/20 backdrop-blur-sm shadow-lg" 
                              : "border-2 border-purple-400/30 hover:border-purple-400/60 bg-purple-600/20 backdrop-blur-sm shadow-md hover:shadow-lg"
                            }
                            transition-all duration-300
                          `}
                        >
                          {/* Декоративный элемент */}
                          <div className={`absolute top-0 left-0 w-1 h-full ${isCompleted ? 'bg-green-500' : 'bg-brand-500'}`} />
                          
                          {/* Заголовок урока */}
                          <div className="flex items-start justify-between mb-6 pl-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                {/* Номер урока */}
                                <div className={`
                                  flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                                  font-bold text-lg shadow-md
                                  ${isCompleted 
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                                    : 'bg-gradient-to-br from-brand-500 to-brand-600 text-white'
                                  }
                                `}>
                                  {lessonNumber}
                                </div>
                                
                                <div className="flex-1">
                                  <h3 className="text-2xl font-bold text-white mb-1">
                                    {lesson.title}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    {isCompleted ? (
                                      <Badge variant="success" className="text-sm px-3 py-1">
                                        Аяқталды
                                      </Badge>
                                    ) : (
                                      <Badge variant="warning" className="text-sm px-3 py-1">
                                        Жүргізілуде
                                      </Badge>
                                    )}
                                    <span className="text-sm text-purple-200">
                                      Сабақ {lessonNumber} / {totalLessons}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/notes?lessonId=${lesson.id}`)}
                                      className="ml-auto text-xs"
                                    >
                                      Жаңалықтар
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Контент урока */}
                          <LessonContent 
                            content={lesson.content}
                            language={
                              selectedCourse?.language === 'English' || selectedCourse?.language === 'Английский' ? 'en-US' : 
                              selectedCourse?.language === 'Spanish' || selectedCourse?.language === 'Испанский' ? 'es-ES' :
                              selectedCourse?.language === 'French' || selectedCourse?.language === 'Французский' ? 'fr-FR' :
                              selectedCourse?.language === 'German' || selectedCourse?.language === 'Немецкий' ? 'de-DE' :
                              'en-US'
                            }
                          />
                          
                          {/* Интерактивные упражнения */}
                          {(() => {
                            const exercises = generateExercises(lesson);
                            if (exercises.length === 0) {
                              // Показываем сообщение, если упражнений нет
                              return (
                                <div className="pl-6 mb-8">
                                  <div className="bg-purple-600/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-400/30 shadow-lg">
                                    <p className="text-white text-center text-lg">
                                      Интерактивті жаттығулар сабаққа сөздік қосылғаннан кейін қолжетімді болады
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <ExerciseTabs 
                                exercises={exercises} 
                                courseId={parseInt(courseId)}
                                lessonId={lesson.id}
                              />
                            );
                          })()}
                          
                          {/* Медиа контент */}
                          {lesson.media_url && (
                            <div className="mb-6 pl-6">
                              <div className="rounded-xl overflow-hidden shadow-lg border-2 border-purple-400/30 bg-purple-600/10">
                                <img 
                                  src={`http://localhost:5000${lesson.media_url}`} 
                                  alt={lesson.title}
                                  className="w-full h-auto object-cover"
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Кнопка завершения */}
                          <div className="pl-6 pt-6 border-t border-purple-400/30">
                            {isCompleted ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-green-600">
                                  <span className="font-semibold">Сабақ аяқталды!</span>
                                </div>
                                <Badge variant="success" className="text-sm">
                                  Керемет жұмыс!
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                  <p className="text-sm text-purple-200 mb-2">
                                    Прогрессіңізді жалғастыру үшін бұл сабақты аяқтаңыз
                                  </p>
                                  <div className="w-full bg-purple-900/50 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                </div>
                                <Button
                                  variant="success"
                                  onClick={() => handleCompleteLesson(lesson.id)}
                                  loading={completingLesson === lesson.id}
                                  className="flex-shrink-0 px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl"
                                >
                                  {completingLesson === lesson.id ? (
                                    <>Аяқталуда...</>
                                  ) : (
                                    <>Сабақты аяқтау</>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <p className="text-purple-200 text-center text-lg">
                    Бұл курста әлі сабақтар жоқ
                  </p>
                </Card>
              )}
            </motion.div>

            {/* Секция с тестами */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">Тесттер</h2>
                <p className="text-purple-200">Біліміңізді тексеріңіз және сертификат алыңыз</p>
              </div>

              {loadingTests ? (
                <Card>
                  <div className="text-center py-8">
                    <LoadingSpinner size="md" text="Тесттер жүктелуде..." />
                  </div>
                </Card>
              ) : courseTests.length > 0 ? (
                <div className="flex flex-col items-center gap-6">
                  {courseTests.map((test, index) => {
                    const canTake = !test.last_attempt || 
                      (test.last_attempt && !test.last_attempt.passed && test.attempts_count < test.max_attempts);
                    const passed = test.last_attempt?.passed;
                    
                    return (
                      <motion.div
                        key={test.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="w-full max-w-4xl"
                      >
                        <Card className={`
                          w-full flex flex-col bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30
                          ${passed ? 'border-green-400 bg-green-500/20' : ''}
                        `}>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <h3 className="text-xl font-bold text-white">{test.title}</h3>
                              {passed && (
                                <Badge variant="success">Тапсырылды</Badge>
                              )}
                            </div>
                            
                            {test.description && (
                              <p className="text-purple-200 mb-4 text-sm">{test.description}</p>
                            )}

                            <div className="space-y-2 mb-4 text-sm">
                              <div className="flex justify-between">
                                <span className="text-purple-200">Сұрақтар:</span>
                                <span className="font-semibold">{test.total_questions || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Тапсыру үшін:</span>
                                <span className="font-semibold">{test.passing_score}%</span>
                              </div>
                              {test.time_limit && (
                                <div className="flex justify-between">
                                  <span className="text-purple-200">Уақыт:</span>
                                  <span className="font-semibold">{test.time_limit} мин</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-purple-200">Попыткалар:</span>
                                <span className="font-semibold">
                                  {test.attempts_count} / {test.max_attempts}
                                </span>
                              </div>
                              {test.last_attempt && (
                                <div className="flex justify-between">
                                  <span className="text-neutral-600">Соңғы нәтиже:</span>
                                  <Badge variant={test.last_attempt.passed ? "success" : "warning"}>
                                    {test.last_attempt.score}%
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-neutral-200">
                            {canTake ? (
                              <Button
                                variant="primary"
                                className="w-full"
                                onClick={() => navigate(`/tests/${test.id}`)}
                              >
                                {test.last_attempt ? "Қайта тапсыру" : "Тестті бастау"}
                              </Button>
                            ) : (
                              <div className="text-center">
                                <p className="text-sm text-neutral-600 mb-2">
                                  Максималды попыткалар санына жеттіңіз
                                </p>
                                {test.last_attempt && (
                                  <Button
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => navigate(`/tests/attempts/${test.last_attempt.id}`)}
                                  >
                                    Нәтижелерді көру
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <div className="text-center py-8">
                    <h3 className="text-xl font-semibold mb-2 text-neutral-900">
                      Тесттер әлі қосылмаған
                    </h3>
                    <p className="text-neutral-600">
                      Бұл курс үшін әлі тесттер қосылмаған. Тесттер жақын арада қосылады.
                    </p>
                  </div>
                </Card>
              )}
            </motion.div>
          </>
        ) : (
          <Card className="text-center">
            <p className="text-neutral-600 text-xl">Курс табылмады</p>
            <Button onClick={() => navigate("/courses")} className="mt-4">
              Курстарға оралу
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
