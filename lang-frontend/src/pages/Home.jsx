import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { auth, courses, lessons, progress, achievements } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/ui/Skeleton";
import { translateCourseTitle, translateCourseDescription, translateLanguage } from "../utils/translator";
import AITutor from "../components/AITutor";
import { 
  Typography, 
  Grid, 
  Box, 
  Card as MUICard, 
  CardContent,
  Select,
  MenuItem,
  FormControl
} from "@mui/material";
import { 
  AutoAwesome,
  Whatshot,
  ShowChart,
  School,
  PlayCircle,
  CheckCircle,
  ArrowForward,
  VideoLibrary,
  Assignment,
  Schedule,
  Language,
  WorkspacePremium,
  Person
} from "@mui/icons-material";

export default function Home() {
  const navigate = useNavigate();

  // Данные пользователя и все API
  const [user, setUser] = useState(null);
  const [coursesData, setCoursesData] = useState([]);
  const [lessonsData, setLessonsData] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [achievementsData, setAchievementsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const token = localStorage.getItem("token");

  // Получаем все данные при загрузке
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const userData = await auth.getMe();
        setUser(userData);

        const coursesRes = await courses.getAll().catch(() => []);

        setCoursesData(coursesRes);

        if (coursesRes && coursesRes.length > 0) {
          try {
            const allLessons = await Promise.all(
              coursesRes.map(course => 
                lessons.getByCourse(course.id).catch(() => [])
              )
            );
            setLessonsData(allLessons.flat());
          } catch (err) {
            console.error("Сабақтарды жүктеу қатесі:", err);
          }
        }

        if (userData.id) {
          try {
            const progressRes = await progress.getByUser(userData.id);
            const progressArray = Array.isArray(progressRes) 
              ? progressRes 
              : (progressRes?.data || progressRes?.rows || []);
            setProgressData(progressArray);
          } catch (err) {
            console.error("Прогресті жүктеу қатесі:", err);
          }

          try {
            const achievementsRes = await achievements.getByUser(userData.id);
            setAchievementsData(achievementsRes);
          } catch (err) {
            console.error("Жетістіктерді жүктеу қатесі:", err);
          }
        }
      } catch (err) {
        console.error("Деректерді жүктеу қатесі:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, token]);

  // Вычисляем статистику
  const totalXP = achievementsData?.xp || 0;
  const currentLevel = achievementsData?.level || 0;
  const lessonsDone = achievementsData?.lessons_completed || progressData.filter(p => p.completed).length || 0;
  
  const calculateStreak = () => {
    if (!progressData || progressData.length === 0) return 0;
    
    // Фильтруем только завершенные уроки
    const completedProgress = progressData.filter(p => p.completed === true && p.updated_at);
    
    if (completedProgress.length === 0) return 0;
    
    // Получаем уникальные даты завершения (только дата, без времени)
    const dates = completedProgress
      .map(p => {
        const date = new Date(p.updated_at);
        // Нормализуем дату к локальному времени (убираем время)
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      })
      .filter((date, index, self) => 
        index === self.findIndex(d => d.getTime() === date.getTime())
      )
      .sort((a, b) => b.getTime() - a.getTime()); // Сортируем по убыванию
    
    if (dates.length === 0) return 0;
    
    // Получаем сегодняшнюю и вчерашнюю дату (только дата, без времени)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Проверяем, начинается ли серия с сегодня или вчера
    const latestDate = dates[0];
    const isToday = latestDate.getTime() === today.getTime();
    const isYesterday = latestDate.getTime() === yesterday.getTime();
    
    if (!isToday && !isYesterday) {
      // Если последняя активность была не сегодня и не вчера, серия прервана
      return 0;
    }
    
    let streak = 1;
    
    // Проверяем последовательность дней
    for (let i = 1; i < dates.length; i++) {
      const currentDate = dates[i - 1];
      const prevDate = dates[i];
      
      // Вычисляем разницу в днях
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Дни идут подряд
        streak++;
      } else {
        // Серия прервана
        break;
      }
    }
    
    return streak;
  };
  
  const currentStreak = calculateStreak();

  const getCourseImage = (course) => {
    if (course.image_url) {
      return `http://localhost:5000${course.image_url}`;
    }
    
    const language = (course.language || course.language_to || 'language').toLowerCase();
    const languageImages = {
      'english': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
      'английский': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
      'ағылшын': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
      'spanish': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'испанский': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'испан': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    };
    
    return languageImages[language] || `https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop&q=80`;
  };

  const coursesWithProgress = coursesData.map(course => {
    const courseLessons = lessonsData.filter(l => l.course_id === course.id);
    const courseProgress = progressData.filter(p => p.course_id === course.id);
    const completedLessons = courseProgress.filter(p => p.completed).length;
    const totalLessons = courseLessons.length || courseProgress.length || 1;
    const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    
    return {
      ...course,
      completedLessons,
      totalLessons,
      progressPercent,
      hasProgress: courseProgress.length > 0 && progressPercent < 100
    };
  }).filter(course => course.hasProgress).slice(0, 3);

  const availableLanguages = [...new Set(
    coursesData.map(c => c.language || c.language_to).filter(Boolean)
  )];

  const handleStartLearning = () => {
    if (selectedLanguage) {
      const course = coursesData.find(c => 
        (c.language || c.language_to)?.toLowerCase() === selectedLanguage.toLowerCase()
      );
      if (course) {
        navigate(`/courses?courseId=${course.id}`);
      } else {
        navigate("/courses");
      }
    } else {
      navigate("/courses");
    }
  };

      if (!token || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white">
        {/* Декоративные элементы */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"></div>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-6"
            >
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-semibold">
                Тіл үйрену платформасы
              </Badge>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Тілдерді оңай
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                үйреніңіз
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-purple-100 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Интерактивті сабақтар, практикалық тапсырмалар және жеке даму жоспарымен 
              тілдерді тиімді үйреніңіз
            </motion.p>

            {/* Форма быстрого старта */}
            <motion.div
              className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex flex-col md:flex-row gap-4">
                <FormControl className="flex-1" sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    paddingLeft: '12px',
                  },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <Language sx={{ fontSize: 20, color: '#4c1d95', position: 'absolute', left: 12, zIndex: 1 }} />
                    <Select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      displayEmpty
                      sx={{ 
                        color: '#4c1d95', 
                        fontWeight: 600,
                        pl: 5,
                        width: '100%'
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>Тілді таңдаңыз</em>
                      </MenuItem>
                      {availableLanguages.map((lang) => (
                        <MenuItem key={lang} value={lang}>
                          {translateLanguage(lang) || lang}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                </FormControl>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartLearning}
                  className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 text-white font-bold px-8 py-4 rounded-xl shadow-2xl"
                >
                  Бастау
                  <ArrowForward className="ml-2" />
                </Button>
              </div>
              <p className="text-center text-white/70 text-sm mt-4">
                Барлығы тегін • Карта қажет емес
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Статистика (если пользователь авторизован) */}
      {user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-16">
          {/* Единый темный фиолетовый фон */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 -z-10"></div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <Grid container spacing={3}>
              {[
                { 
                  label: "Жалпы XP", 
                  value: totalXP, 
                  icon: <AutoAwesome sx={{ fontSize: 32 }} />, 
                  color: "from-purple-500 to-purple-600",
                  bgColor: "bg-purple-600/20 backdrop-blur-sm",
                  textColor: "text-white",
                  borderColor: "border-purple-400/30"
                },
                { 
                  label: "Ағымдағы серия", 
                  value: `${currentStreak} күн`, 
                  icon: <Whatshot sx={{ fontSize: 32 }} />, 
                  color: "from-purple-500 to-violet-500",
                  bgColor: "bg-purple-600/20 backdrop-blur-sm",
                  textColor: "text-white",
                  borderColor: "border-purple-400/30"
                },
                { 
                  label: "Деңгей", 
                  value: currentLevel, 
                  icon: <ShowChart sx={{ fontSize: 32 }} />, 
                  color: "from-violet-500 to-purple-500",
                  bgColor: "bg-purple-600/20 backdrop-blur-sm",
                  textColor: "text-white",
                  borderColor: "border-purple-400/30"
                },
                { 
                  label: "Аяқталған сабақ", 
                  value: lessonsDone, 
                  icon: <School sx={{ fontSize: 32 }} />, 
                  color: "from-purple-500 to-purple-600",
                  bgColor: "bg-purple-600/20 backdrop-blur-sm",
                  textColor: "text-white",
                  borderColor: "border-purple-400/30"
                },
              ].map((stat, index) => (
                <Grid item xs={12} sm={6} lg={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <Card className={`${stat.bgColor} border-2 ${stat.borderColor} shadow-lg hover:shadow-xl transition-all`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-200 mb-1">{stat.label}</p>
                          <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                          {stat.icon}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </section>
      )}

      {/* AI-Репетитор */}
      {user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 -z-10"></div>
          <div className="relative">
            <AITutor onStartConversation={() => navigate("/ai-conversation")} />
          </div>
        </section>
      )}

      {/* AI-Друг для разговоров */}
      {user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 -z-10"></div>
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Найди своего AI-друга
                </h2>
              <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                Практикуй разговорную речь с дружелюбными AI-собеседниками
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/ai-friend")}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-8 py-4 text-lg"
              >
                <Person sx={{ mr: 2, fontSize: 28 }} />
                Найти друга для разговора
                <ArrowForward sx={{ ml: 2 }} />
              </Button>
            </motion.div>
          </div>
        </section>
      )}

      {/* Продолжить обучение */}
      {user && coursesWithProgress.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-8 relative">
          {/* Единый темный фиолетовый фон */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 -z-10"></div>
          <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Оқуды жалғастыру
            </h2>
            <p className="text-purple-200">Тоқтаған жеріңізді таңдаңыз</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {coursesWithProgress.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card 
                  onClick={() => navigate(`/courses?courseId=${course.id}`)}
                  className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30 hover:border-purple-400/60 shadow-lg hover:shadow-2xl transition-all cursor-pointer h-full"
                >
                  <div className="relative h-40 bg-gradient-to-br from-purple-400 to-purple-600 rounded-t-xl overflow-hidden">
                    <img 
                      src={getCourseImage(course)} 
                      alt={course.title}
                      className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle sx={{ fontSize: 64, color: 'white', opacity: 0.9 }} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {translateCourseTitle(course.title)}
                    </h3>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-purple-200 mb-2">
                        <span>Прогресс</span>
                        <span>{Math.round(course.progressPercent)}%</span>
                      </div>
                      <div className="w-full bg-purple-900/50 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${course.progressPercent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses?courseId=${course.id}`);
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Жалғастыру
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          </div>
        </section>
      )}

      {/* Преимущества */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        {/* Единый темный фиолетовый фон */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 -z-10"></div>
        <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Неге бізді таңдау керек?
          </h2>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Заманауи оқыту әдістері мен интерактивті платформа
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
              {
                icon: <VideoLibrary sx={{ fontSize: 64, color: "#a855f7" }} />,
                title: "Интерактивті сабақтар",
                description: "Видео сабақтар, аудио материалдар және практикалық тапсырмалар"
              },
              {
                icon: <Assignment sx={{ fontSize: 64, color: "#a855f7" }} />,
                title: "1000+ тапсырма",
                description: "Әр түрлі интерактивті тапсырмалар мен тесттер"
              },
              {
                icon: <Schedule sx={{ fontSize: 64, color: "#a855f7" }} />,
                title: "Жеке жоспар",
                description: "Сіздің жылдамдығыңызға сәйкес кесте және прогресс бақылауы"
              }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-purple-200 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      {/* Все курсы */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        {/* Единый темный фиолетовый фон */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 -z-10"></div>
        <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Барлық курстар
              </h2>
              <p className="text-xl text-purple-200">
                Тілдік курстар коллекциямызбен танысыңыз
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/courses")}
              className="hidden md:flex"
            >
              Барлығын көру
              <ArrowForward className="ml-2" />
            </Button>
          </div>
        </motion.div>

        {loading && coursesData.length === 0 ? (
          <SkeletonList count={6} />
        ) : coursesData.length === 0 ? (
          <EmptyState
            icon={null}
            title="Курстар әлі қолжетімсіз"
            description="Жақында тіл үйренуге арналған жаңа курстар пайда болады"
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesData.slice(0, 6).map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card 
                  onClick={() => navigate(`/courses?courseId=${course.id}`)}
                  className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30 hover:border-purple-400/60 shadow-lg hover:shadow-2xl transition-all cursor-pointer h-full overflow-hidden group"
                >
                  <div className="relative h-48 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 overflow-hidden">
                    <img 
                      src={getCourseImage(course)} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4 flex items-center gap-1">
                      <Language sx={{ fontSize: 16, color: 'white' }} />
                      <Badge className="bg-purple-600/80 backdrop-blur-sm text-white border-0">
                        {translateLanguage(course.language)}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                      {translateCourseTitle(course.title)}
                    </h3>
                    <p className="text-purple-200 mb-4 line-clamp-2">
                      {translateCourseDescription(course.description)}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-purple-400/30">
                      <span className="text-sm text-purple-200 flex items-center gap-1">
                        <School sx={{ fontSize: 18 }} />
                        {lessonsData.filter(l => l.course_id === course.id).length || 0} сабақ
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses?courseId=${course.id}`);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Зерттеу
                        <ArrowForward className="ml-1" sx={{ fontSize: 16 }} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {coursesData.length > 6 && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Button
              variant="primary"
              onClick={() => navigate("/courses")}
              className="bg-purple-600 hover:bg-purple-700 px-8 py-4"
            >
              Барлық курстарды көру
              <ArrowForward className="ml-2" />
            </Button>
          </motion.div>
        )}
        </div>
      </section>
    </div>
  );
}
