import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/Toast";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import { 
  Tabs, 
  Tab, 
  Box, 
  Typography, 
  Paper,
  TextField,
  Avatar,
  Divider,
  Chip
} from "@mui/material";
import { Person, Lock, BarChart } from "@mui/icons-material";
import { formatDateKZ } from "../utils/dateFormatter";

export default function Profile() {
  const navigate = useNavigate();
  const { logout, loadUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [activeTab, setActiveTab] = useState("profile"); // profile, password, stats

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const userData = await auth.getMe();
        if (!isMounted) return;
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (err) {
        if (isMounted) {
          toast.error("Профильді жүктеу қатесі");
          navigate("/login");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadUser();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedUser = await auth.updateProfile(formData.name);
      setUser(updatedUser);
      setFormData(prev => ({ ...prev, name: updatedUser.name }));
      await loadUser();
      toast.success('Профиль сақталды!');
      
      // Очищаем поля
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      toast.error(err.message || "Профильді жаңарту қатесі");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast.error("Ағымдағы құпия сөзді енгізіңіз");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Құпия сөздер сәйкес келмейді");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Құпия сөз кемінде 6 таңбадан тұруы керек");
      return;
    }

    setSaving(true);
    try {
      await auth.changePassword(formData.currentPassword, formData.newPassword);
      toast.success("Құпия сөз сәтті өзгертілді!");
      
      // Очищаем поля
      setFormData(prev => ({ 
        ...prev, 
        currentPassword: "", 
        newPassword: "", 
        confirmPassword: "" 
      }));
    } catch (err) {
      toast.error(err.message || "Құпия сөзді өзгерту қатесі");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Профильді жүктеу..." />
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
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Профиль параметрлері</h1>
              <p className="text-white/70 text-lg">
                Профиліңізді және есептік жазба параметрлерін басқарыңыз
              </p>
              {user && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {user.name || "Пайдаланушы"}
                    </p>
                    <p className="text-white/60 text-sm">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/settings")}
                className="px-6 py-3"
              >
                Параметрлер
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm("Шығуды қалайсыз ба?")) {
                    logout();
                  }
                }}
                className="px-6 py-3"
              >
                Шығу
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Табы - MUI Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)', mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '1rem',
                minHeight: 64,
                '&.Mui-selected': {
                  color: '#818cf8',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#818cf8',
              },
            }}
          >
            <Tab 
              icon={<Person />} 
              iconPosition="start"
              label="Профиль" 
              value="profile" 
            />
            <Tab 
              icon={<Lock />} 
              iconPosition="start"
              label="Құпия сөз" 
              value="password" 
            />
            <Tab 
              icon={<BarChart />} 
              iconPosition="start"
              label="Статистика" 
              value="stats" 
            />
          </Tabs>
        </Box>

        {/* Вкладка Профиль */}
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h2 className="text-2xl font-bold mb-6">Профиль ақпараты</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-white/80 mb-2">Аты</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Атыңызды енгізіңіз"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                  <p className="text-white/60 text-sm mt-2">
                    Email өзгертілмейді
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={saving}
                    className="w-full sm:w-auto"
                  >
                    {saving ? "Сақталуда..." : "Өзгерістерді сақтау"}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Құпия сөз бөлімі */}
        {activeTab === "password" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h2 className="text-2xl font-bold mb-6">Құпия сөзді өзгерту</h2>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-white/80 mb-2">
                    Ағымдағы құпия сөз
                  </label>
                  <Input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Ағымдағы құпия сөзді енгізіңіз"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Жаңа құпия сөз</label>
                  <Input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    placeholder="Кемінде 6 таңба"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">
                    Жаңа құпия сөзді растау
                  </label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Жаңа құпия сөзді қайталаңыз"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={saving}
                    className="w-full sm:w-auto"
                  >
                    {saving ? "Құпия сөзді өзгерту..." : "Құпия сөзді өзгерту"}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Статистика бөлімі */}
        {activeTab === "stats" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h2 className="text-2xl font-bold mb-6">Есептік жазба статистикасы</h2>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Email</span>
                    <Badge variant="info">{user?.email}</Badge>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Аты</span>
                    <span className="text-white font-semibold">
                      {user?.name || "Көрсетілмеген"}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Тіркелу күні</span>
                    <span className="text-white/80">
                      {user?.created_at
                        ? formatDateKZ(user.created_at)
                        : "Белгісіз"}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Пайдаланушы ID</span>
                    <span className="text-white/60 font-mono text-sm">
                      #{user?.id}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

