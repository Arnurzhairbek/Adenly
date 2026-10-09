import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { auth, progress } from "../api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import ProgressChart from "../components/ProgressChart";
import ActivityCalendar from "../components/ActivityCalendar";
import AITutor from "../components/AITutor";
import { 
  Paper, 
  Typography, 
  Tabs, 
  Tab, 
  Box, 
  Grid, 
  Chip,
  Card as MUICard,
  CardContent
} from "@mui/material";
import { CheckCircle, Pending, Assignment } from "@mui/icons-material";
import { formatDateTimeKZ } from "../utils/dateFormatter";

export default function Progress() {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, completed, pending

  useEffect(() => {
    let isMounted = true;
    const loadProgress = async () => {
      try {
        // Получаем данные пользователя
        const userData = await auth.getMe();
        if (!isMounted) return;
        setUser(userData);

        if (userData?.id) {
          // Получаем прогресс пользователя
          const response = await progress.getByUser(userData.id);
          if (!isMounted) return;
          
          // Бэкенд возвращает { data: [...], pagination: {...} }
          // Обрабатываем оба варианта: объект с data или прямой массив
          let progressArray = [];
          if (Array.isArray(response)) {
            progressArray = response;
          } else if (response && Array.isArray(response.data)) {
            progressArray = response.data;
          } else if (response && Array.isArray(response.rows)) {
            progressArray = response.rows;
          }
          
          if (isMounted) {
            setProgressData(progressArray);
          }
        }
      } catch (err) {
        console.error("Прогресті жүктеу қатесі:", err);
        if (isMounted) {
          setProgressData([]); // Устанавливаем пустой массив в случае ошибки
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadProgress();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ ПЕРЕД ЛЮБЫМИ УСЛОВНЫМИ RETURN!
  // Убеждаемся, что progressData всегда массив
  const safeProgressData = Array.isArray(progressData) ? progressData : [];
  
  // Данные для графика прогресса по курсам (useMemo должен быть до return)
  const chartData = useMemo(() => {
    if (!safeProgressData || safeProgressData.length === 0) {
      return [];
    }
    
    const courseStats = {};
    safeProgressData.forEach(p => {
      if (p && p.course_title) {
        const courseTitle = p.course_title || 'Без названия';
        if (!courseStats[courseTitle]) {
          courseStats[courseTitle] = { completed: 0, total: 0 };
        }
        courseStats[courseTitle].total++;
        if (p.completed) {
          courseStats[courseTitle].completed++;
        }
      }
    });

    if (Object.keys(courseStats).length === 0) {
      return [];
    }

    return Object.entries(courseStats)
      .slice(0, 5) // Топ 5 курсов
      .map(([course, stats]) => ({
        label: course.length > 15 ? course.substring(0, 15) + "..." : course,
        value: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .filter(item => item.value >= 0); // Жарамды мәндерді сүзгілеу
  }, [safeProgressData]);

  const completedLessons = safeProgressData.filter(p => p && p.completed).length;
  const filteredProgress = safeProgressData.filter(p => {
    if (!p) return false;
    if (filter === "completed") return p.completed;
    if (filter === "pending") return !p.completed;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Прогресті жүктеу..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <motion.h1 
          className="text-5xl font-bold mb-10 text-center text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Сіздің прогрессіңіз
        </motion.h1>
        
        <Paper 
          elevation={3}
          sx={{ 
            p: 3, 
            mb: 4, 
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(88, 28, 135, 0.7) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 3
          }}
        >
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <MUICard 
                sx={{ 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: 2
                }}
              >
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Өтілген сабақтар
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                    {completedLessons}
                  </Typography>
                </CardContent>
              </MUICard>
            </Grid>
            <Grid item xs={12} sm={4}>
              <MUICard 
                sx={{ 
                  background: 'rgba(99, 102, 241, 0.1)', 
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 2
                }}
              >
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Жүргізілуде
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#6366f1' }}>
                    {safeProgressData.length - completedLessons}
                  </Typography>
                </CardContent>
              </MUICard>
            </Grid>
            <Grid item xs={12} sm={4}>
              <MUICard 
                sx={{ 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: 2
                }}
              >
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Барлығы жазбалар
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                    {safeProgressData.length}
                  </Typography>
                </CardContent>
              </MUICard>
            </Grid>
          </Grid>

          {/* Сүзгілер - MUI Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={filter}
              onChange={(e, newValue) => setFilter(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&.Mui-selected': {
                    color: '#8b5cf6',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#8b5cf6',
                },
              }}
            >
              <Tab 
                icon={<Assignment />} 
                iconPosition="start"
                label={`Барлығы (${safeProgressData.length})`} 
                value="all" 
              />
              <Tab 
                icon={<CheckCircle />} 
                iconPosition="start"
                label={`Аяқталған (${completedLessons})`} 
                value="completed" 
              />
              <Tab 
                icon={<Pending />} 
                iconPosition="start"
                label={`Жүргізілуде (${safeProgressData.length - completedLessons})`} 
                value="pending" 
              />
            </Tabs>
          </Box>
        </Paper>

        {/* Календарь активности */}
        {safeProgressData.length > 0 && (
          <Card className="mb-8">
            <ActivityCalendar progressData={safeProgressData} monthsToShow={3} />
          </Card>
        )}

        {/* График прогресса */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <ProgressChart
              data={chartData}
              label="Курстар бойынша прогресс (%)"
              color="indigo"
            />
          </Card>
        )}

        {/* AI-Репетитор */}
        <div className="mb-8">
          <AITutor onStartConversation={() => navigate("/ai-conversation")} />
        </div>

        {filteredProgress.length > 0 ? (
          <div className="space-y-4">
            {filteredProgress.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                        {p.course_title}
                      </Typography>
                      <Chip
                        icon={p.completed ? <CheckCircle /> : <Pending />}
                        label={p.completed ? "Аяқталды" : "Жүргізілуде"}
                        color={p.completed ? "success" : "warning"}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                      <p className="text-neutral-600 mb-2">{p.lesson_title}</p>
                      {p.updated_at && (
                        <p className="text-xs text-purple-200">
                          Жаңартылды: {formatDateTimeKZ(p.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={null}
              title="Прогресс табылмады"
              description={`Фильтр "${filter === "completed" ? "аяқталған" : filter === "pending" ? "жүргізілуде" : "барлығы"}" үшін прогресс жазбалары жоқ`}
              action={
                <Button onClick={() => navigate("/courses")}>
                  Курс таңдау
                </Button>
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}
