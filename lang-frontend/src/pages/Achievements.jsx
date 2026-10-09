import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { auth, achievements } from "../api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { 
  Paper, 
  Typography, 
  LinearProgress, 
  Box,
  Grid,
  Card as MUICard,
  CardContent
} from "@mui/material";
import { EmojiEvents, School, Star, TrendingUp } from "@mui/icons-material";
import { formatDateTimeKZ } from "../utils/dateFormatter";

export default function Achievements() {
  const navigate = useNavigate();
  const [achievementsData, setAchievementsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        // Получаем данные пользователя
        const userData = await auth.getMe();
        
        if (userData.id) {
          const data = await achievements.getByUser(userData.id);
          setAchievementsData(data);
        }
      } catch (err) {
        console.error("Жетістіктерді жүктеу қатесі:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Жетістіктерді жүктеу..." />
      </div>
    );
  }

  // Расчет прогресса до следующего уровня
  const currentXP = achievementsData?.xp || 0;
  const currentLevel = achievementsData?.level || 0;
  const xpForNextLevel = (currentLevel + 1) * 1000;
  const xpInCurrentLevel = currentXP % 1000;
  const progressPercent = (xpInCurrentLevel / 1000) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <motion.h1 
          className="text-4xl font-bold mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Жетістіктер
        </motion.h1>
        
        {achievementsData ? (
          <div className="space-y-6">
            {/* Уровень и XP */}
            <Card>
              <div className="text-center mb-8">
                <motion.div 
                  className="text-8xl mb-4"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                </motion.div>
                <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-violet-300 mb-2">
                  Деңгей {currentLevel}
                </h2>
                <p className="text-2xl text-white/70 mb-6">{currentXP} XP</p>
                
                {/* Келесі деңгейге дейінгі прогресс - MUI LinearProgress */}
                <Box sx={{ maxWidth: 'md', mx: 'auto', mt: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Деңгей {currentLevel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {xpInCurrentLevel} / 1000 XP
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Деңгей {currentLevel + 1}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                      height: 16,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              </div>
            </Card>

            {/* Статистика - MUI Grid и Cards */}
            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid item xs={12} md={4}>
                <MUICard 
                  sx={{ 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <CardContent>
                    <School sx={{ fontSize: 60, mb: 2, color: '#818cf8' }} />
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#818cf8', mb: 1 }}>
                      {achievementsData.lessons_completed || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Аяқталған сабақтар
                    </Typography>
                  </CardContent>
                </MUICard>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <MUICard 
                  sx={{ 
                    background: 'rgba(139, 92, 246, 0.1)', 
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <CardContent>
                    <Star sx={{ fontSize: 60, mb: 2, color: '#a78bfa' }} />
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#a78bfa', mb: 1 }}>
                      {currentXP}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Барлығы тәжірибе
                    </Typography>
                  </CardContent>
                </MUICard>
              </Grid>

              <Grid item xs={12} md={4}>
                <MUICard 
                  sx={{ 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <CardContent>
                    <TrendingUp sx={{ fontSize: 60, mb: 2, color: '#10b981' }} />
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#10b981', mb: 1 }}>
                      {xpForNextLevel - currentXP}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Келесі деңгейге дейін XP
                    </Typography>
                  </CardContent>
                </MUICard>
              </Grid>
            </Grid>

            {/* Дополнительная информация */}
            {achievementsData.updated_at && (
              <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
                <p className="text-center text-purple-200">
                  Соңғы жаңарту: {formatDateTimeKZ(achievementsData.updated_at)}
                </p>
              </Card>
            )}

            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/courses")}>
                Курстарды зерттеу →
              </Button>
              <Button variant="ghost" onClick={() => navigate("/progress")}>
                Менің прогрессім →
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={null}
              title="Жетістіктер әлі қолжетімсіз"
              description="Алғашқы жетістіктерді алу үшін курстарды зерттеуді бастаңыз"
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
