import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "../components/Toast";
import { auth } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/LoadingSpinner";
import Badge from "../components/ui/Badge";

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  const [settings, setSettings] = useState({
    language: "kk", // kk, ru, en
    theme: "dark", // dark, light, auto
    notifications: {
      email: true,
      push: true,
      achievements: true,
      lessons: true,
      weeklyReport: false,
    },
    learning: {
      dailyGoal: 30, // минут
      difficulty: "auto", // easy, medium, hard, auto
      autoAdvance: false,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userData = await auth.getMe();
        setUser(userData);
        
        // Загружаем сохраненные настройки с сервера
        try {
          const savedSettings = await auth.getSettings();
          if (savedSettings && Object.keys(savedSettings).length > 0) {
            setSettings(prev => ({
              ...prev,
              ...savedSettings,
              notifications: { ...prev.notifications, ...(savedSettings.notifications || {}) },
              learning: { ...prev.learning, ...(savedSettings.learning || {}) }
            }));
          }
        } catch (settingsErr) {
          // Если настройки не найдены, используем значения по умолчанию
          console.log("Используются настройки по умолчанию");
        }
      } catch (err) {
        toast.error("Параметрлерді жүктеу қатесі");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Сохраняем настройки на сервере
      await auth.saveSettings(settings);
      
      // Также сохраняем в localStorage для быстрого доступа
      localStorage.setItem("userSettings", JSON.stringify(settings));
      
      // Применяем настройки
      applySettings(settings);
      
      toast.success("Параметрлер сәтті сақталды!");
      
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (err) {
      toast.error(err.message || "Параметрлерді сақтау қатесі");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const applySettings = (newSettings) => {
    // Применяем язык
    if (newSettings.language) {
      document.documentElement.lang = newSettings.language;
      // Сохраняем язык в localStorage для использования в других компонентах
      localStorage.setItem("userLanguage", newSettings.language);
    }

    // Применяем тему
    if (newSettings.theme) {
      const root = document.documentElement;
      if (newSettings.theme === "light") {
        root.classList.remove("dark");
        localStorage.setItem("theme", "light");
      } else if (newSettings.theme === "dark") {
        root.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else if (newSettings.theme === "auto") {
        // Автоматическая тема на основе системных настроек
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
        localStorage.setItem("theme", "auto");
      }
    }

    // Применяем настройки уведомлений (можно использовать для будущих push-уведомлений)
    if (newSettings.notifications) {
      localStorage.setItem("notificationSettings", JSON.stringify(newSettings.notifications));
    }

    // Применяем настройки обучения
    if (newSettings.learning) {
      localStorage.setItem("learningSettings", JSON.stringify(newSettings.learning));
    }
  };

  const handleNotificationChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const handleLearningChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      learning: {
        ...prev.learning,
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Параметрлерді жүктеу..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
            className="mb-6"
          >
            ← Басты бетке оралу
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Параметрлер</h1>
          <p className="text-white/70 text-lg">
            Жүйе параметрлерін және жеке баптауларды өзгертіңіз
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Язык интерфейса */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <h2 className="text-2xl font-bold mb-6">Интерфейс тілі</h2>
              <div>
                <label className="block text-white/80 mb-2 font-semibold">
                  Тілді таңдаңыз
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border-2 border-purple-500/30 text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all duration-200"
                >
                  <option value="kk">Қазақша</option>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
            </Card>
          </motion.div>

          {/* Тема */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h2 className="text-2xl font-bold mb-6">Тема</h2>
              <div>
                <label className="block text-white/80 mb-2 font-semibold">
                  Теманы таңдаңыз
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border-2 border-purple-500/30 text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all duration-200"
                >
                  <option value="dark">Қараңғы</option>
                  <option value="light">Жарық</option>
                  <option value="auto">Автоматты</option>
                </select>
              </div>
            </Card>
          </motion.div>

          {/* Уведомления */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <h2 className="text-2xl font-bold mb-6">Хабарландырулар</h2>
              <div className="space-y-4">
                {Object.entries({
                  email: "Email хабарландырулар",
                  push: "Браузер хабарландырулары",
                  achievements: "Жетістіктер туралы",
                  lessons: "Сабақтар туралы",
                  weeklyReport: "Апталық есеп",
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white/90">{label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications[key]}
                        onChange={(e) => handleNotificationChange(key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Обучение */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <h2 className="text-2xl font-bold mb-6">Оқу параметрлері</h2>
              <div className="space-y-6">
                {/* Ежедневная цель */}
                <div>
                  <label className="block text-white/80 mb-2 font-semibold">
                    Күнделікті мақсат (минут)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    step="5"
                    value={settings.learning.dailyGoal}
                    onChange={(e) => handleLearningChange("dailyGoal", parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border-2 border-purple-500/30 text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all duration-200"
                  />
                  <p className="mt-2 text-sm text-white/60">
                    Күніне {settings.learning.dailyGoal} минут оқу мақсаты
                  </p>
                </div>

                {/* Сложность */}
                <div>
                  <label className="block text-white/80 mb-2 font-semibold">
                    Қиындық деңгейі
                  </label>
                  <select
                    value={settings.learning.difficulty}
                    onChange={(e) => handleLearningChange("difficulty", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border-2 border-purple-500/30 text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all duration-200"
                  >
                    <option value="easy">🟢 Оңай</option>
                    <option value="medium">🟡 Орташа</option>
                    <option value="hard">🔴 Қиын</option>
                    <option value="auto">Автоматты</option>
                  </select>
                </div>

                {/* Автопродвижение */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <span className="text-white/90 font-semibold block">Автоматты өту</span>
                    <span className="text-white/60 text-sm">
                      Сабақты аяқтағаннан кейін келесі сабаққа автоматты түрде өту
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.learning.autoAdvance}
                      onChange={(e) => handleLearningChange("autoAdvance", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Кнопки */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 justify-end"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/home")}
              disabled={saving}
            >
              Болдырмау
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={saving}
            >
              {saving ? "Сақталуда..." : "💾 Параметрлерді сақтау"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

