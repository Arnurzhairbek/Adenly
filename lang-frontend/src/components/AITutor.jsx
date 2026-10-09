import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { aiTutor } from "../api";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import LoadingSpinner from "./LoadingSpinner";
import Button from "./ui/Button";
import { 
  AutoAwesome, 
  TrendingUp, 
  Lightbulb, 
  School,
  Warning,
  CheckCircle,
  ArrowForward
} from "@mui/icons-material";

export default function AITutor({ onStartConversation }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await aiTutor.analyzeProgress();
      setAnalysis(data);
    } catch (err) {
      console.error("Ошибка загрузки анализа:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
        <div className="text-center py-8">
          <p className="text-red-400">Ошибка: {error}</p>
          <Button onClick={loadAnalysis} className="mt-4">
            Попробовать снова
          </Button>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const { overallProgress, weakAreas, recommendations, insights } = analysis;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
          <AutoAwesome sx={{ fontSize: 32, color: 'white' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI-Репетитор</h2>
          <p className="text-purple-200">Персональные рекомендации для вашего обучения</p>
        </div>
      </motion.div>

      {/* Общий прогресс */}
      <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-300 mb-1">
              {overallProgress.lessonsCompleted}
            </div>
            <div className="text-sm text-purple-200">Уроков завершено</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-300 mb-1">
              {overallProgress.level}
            </div>
            <div className="text-sm text-purple-200">Уровень</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-300 mb-1">
              {Math.round(overallProgress.completionRate)}%
            </div>
            <div className="text-sm text-purple-200">Завершено</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-300 mb-1">
              {overallProgress.totalErrors}
            </div>
            <div className="text-sm text-purple-200">Ошибок исправлено</div>
          </div>
        </div>
      </Card>

      {/* Инсайты */}
      {insights && insights.length > 0 && (
        <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb sx={{ fontSize: 24, color: '#a78bfa' }} />
            <h3 className="text-xl font-bold text-white">Инсайты</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg ${
                  insight.positive
                    ? 'bg-green-500/20 border border-green-400/30'
                    : 'bg-yellow-500/20 border border-yellow-400/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {insight.positive ? (
                    <CheckCircle sx={{ fontSize: 20, color: '#10b981', mt: 0.5 }} />
                  ) : (
                    <Warning sx={{ fontSize: 20, color: '#f59e0b', mt: 0.5 }} />
                  )}
                  <p className="text-white flex-1">{insight.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Слабые места */}
      {weakAreas && weakAreas.length > 0 && (
        <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp sx={{ fontSize: 24, color: '#a78bfa' }} />
            <h3 className="text-xl font-bold text-white">Области для улучшения</h3>
          </div>
          <div className="space-y-3">
            {weakAreas.map((area, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-purple-700/30 rounded-lg"
              >
                <div>
                  <p className="text-white font-semibold capitalize">
                    {area.type === 'grammar' ? 'Грамматика' :
                     area.type === 'vocabulary' ? 'Словарный запас' :
                     area.type === 'pronunciation' ? 'Произношение' :
                     area.type === 'translation' ? 'Перевод' :
                     area.type === 'comprehension' ? 'Понимание' : area.type}
                  </p>
                  <p className="text-purple-200 text-sm">
                    {area.count} ошибок
                  </p>
                </div>
                <Badge variant="warning">
                  Требует внимания
                </Badge>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Рекомендации */}
      {recommendations && recommendations.length > 0 && (
        <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
          <div className="flex items-center gap-2 mb-4">
            <School sx={{ fontSize: 24, color: '#a78bfa' }} />
            <h3 className="text-xl font-bold text-white">Рекомендации</h3>
          </div>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gradient-to-br from-purple-700/40 to-indigo-700/40 rounded-lg border border-purple-400/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-bold text-white">{rec.title}</h4>
                      {rec.priority === 'high' && (
                        <Badge variant="error" className="text-xs">Важно</Badge>
                      )}
                    </div>
                    <p className="text-purple-200 mb-3">{rec.description}</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (rec.type === 'weak_area' && onStartConversation) {
                          onStartConversation();
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {rec.action}
                      <ArrowForward sx={{ fontSize: 16, ml: 1 }} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Кнопка для разговорной практики */}
      {onStartConversation && (
        <Card className="bg-gradient-to-br from-purple-600/30 to-indigo-600/30 backdrop-blur-sm border-2 border-purple-400/50">
          <div className="text-center py-6">
            <AutoAwesome sx={{ fontSize: 48, color: '#a78bfa', mb: 2 }} />
            <h3 className="text-2xl font-bold text-white mb-2">
              Практикуйте разговор с AI
            </h3>
            <p className="text-purple-200 mb-4">
              Улучшите свои разговорные навыки с помощью нашего AI-репетитора
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={onStartConversation}
              className="bg-purple-600 hover:bg-purple-700 px-8"
            >
              Начать разговор
              <ArrowForward sx={{ ml: 1 }} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

