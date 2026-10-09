import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { notifications } from "../api";
import MobileMenu from "./MobileMenu";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // Используется только для проверки наличия пользователя в useEffect
  const [unreadCount, setUnreadCount] = useState(0);
  const [coursesMenuOpen, setCoursesMenuOpen] = useState(false);
  const [ratingMenuOpen, setRatingMenuOpen] = useState(false);
  const coursesMenuRef = useRef(null);
  const ratingMenuRef = useRef(null);

  // Загружаем счетчик непрочитанных уведомлений
  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        try {
          const data = await notifications.getAll();
          const unread = Array.isArray(data) 
            ? data.filter(n => !n.is_read).length 
            : 0;
          setUnreadCount(unread);
        } catch (err) {
          console.warn("Хабарландыруларды жүктеу қатесі:", err);
        }
      };
      fetchUnreadCount();
      
      // Обновляем счетчик каждые 30 секунд
      const interval = setInterval(fetchUnreadCount, 30000);
      
      // Обновляем счетчик при фокусе на окне (когда пользователь возвращается на вкладку)
      const handleFocus = () => {
        fetchUnreadCount();
      };
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [user]);

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (coursesMenuRef.current && !coursesMenuRef.current.contains(event.target)) {
        setCoursesMenuOpen(false);
      }
      if (ratingMenuRef.current && !ratingMenuRef.current.contains(event.target)) {
        setRatingMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Закрываем меню при изменении маршрута
  useEffect(() => {
    setCoursesMenuOpen(false);
    setRatingMenuOpen(false);
  }, [location.pathname]);


  return (
    <motion.div
      className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Навигация */}
        <motion.header
          className="flex justify-between items-center px-6 py-4 bg-slate-800/80 backdrop-blur-md border-b border-purple-500/20 shadow-lg sticky top-0 z-50"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <h1
          onClick={() => navigate("/home")}
          className="text-2xl font-bold tracking-tight cursor-pointer transition-all duration-200 hover:scale-105"
        >
          <span className="text-purple-400">
            Adenly
          </span>
        </h1>

        <nav className="hidden md:flex gap-1 text-sm">
          <button
            onClick={() => navigate("/home")}
            className={`px-4 py-2 rounded-lg hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-200 font-medium ${
              location.pathname === "/home" || location.pathname === "/"
                ? "bg-purple-500/20 text-purple-300"
                : "text-gray-300"
            }`}
          >
            Басты бет
          </button>
          
          {/* Курстар менюсі */}
          <div className="relative" ref={coursesMenuRef}>
            <button
              onClick={() => setCoursesMenuOpen(!coursesMenuOpen)}
              className={`px-4 py-2 rounded-lg hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-200 font-medium flex items-center gap-1 ${
                location.pathname === "/courses" || location.pathname === "/progress"
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-gray-300"
              }`}
            >
              Курстар
              <svg
                className={`w-4 h-4 transition-transform ${coursesMenuOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {coursesMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-1 bg-slate-800/95 backdrop-blur-md rounded-lg shadow-xl border border-purple-500/30 overflow-hidden z-50 min-w-[160px]"
                >
                  <button
                    onClick={() => {
                      navigate("/courses");
                      setCoursesMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-purple-500/20 transition-colors ${
                      location.pathname === "/courses" ? "bg-purple-500/20 text-purple-300" : "text-gray-300"
                    }`}
                  >
                    Барлық курстар
                  </button>
                  <button
                    onClick={() => {
                      navigate("/progress");
                      setCoursesMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-purple-500/20 transition-colors ${
                      location.pathname === "/progress" ? "bg-purple-500/20 text-purple-300" : "text-gray-300"
                    }`}
                  >
                    Менің прогрессім
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Рейтинг менюсі */}
          <div className="relative" ref={ratingMenuRef}>
            <button
              onClick={() => setRatingMenuOpen(!ratingMenuOpen)}
              className={`px-4 py-2 rounded-lg hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-200 font-medium flex items-center gap-1 ${
                location.pathname === "/achievements" || location.pathname === "/leaderboard" || location.pathname === "/certificates" || location.pathname.startsWith("/certificates/")
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-gray-300"
              }`}
            >
              Рейтинг
              <svg
                className={`w-4 h-4 transition-transform ${ratingMenuOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {ratingMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-1 bg-slate-800/95 backdrop-blur-md rounded-lg shadow-xl border border-purple-500/30 overflow-hidden z-50 min-w-[160px]"
                >
                  <button
                    onClick={() => {
                      navigate("/achievements");
                      setRatingMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-purple-500/20 transition-colors ${
                      location.pathname === "/achievements" ? "bg-purple-500/20 text-purple-300" : "text-gray-300"
                    }`}
                  >
                    Жетістіктер
                  </button>
                  <button
                    onClick={() => {
                      navigate("/leaderboard");
                      setRatingMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-purple-500/20 transition-colors ${
                      location.pathname === "/leaderboard" ? "bg-purple-500/20 text-purple-300" : "text-gray-300"
                    }`}
                  >
                    Көшбасшылар кестесі
                  </button>
                  <button
                    onClick={() => {
                      navigate("/certificates");
                      setRatingMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-purple-500/20 transition-colors ${
                      location.pathname === "/certificates" || location.pathname.startsWith("/certificates/") 
                        ? "bg-purple-500/20 text-purple-300" 
                        : "text-gray-300"
                    }`}
                  >
                    Сертификаттар
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => navigate("/ai-friend")}
            className={`px-4 py-2 rounded-lg hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-200 font-medium ${
              location.pathname === "/ai-friend"
                ? "bg-purple-500/20 text-purple-300"
                : "text-gray-300"
            }`}
          >
            AI-Друг
          </button>

          <button
            onClick={() => navigate("/notifications")}
            className={`px-4 py-2 rounded-lg hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-200 font-medium relative ${
              location.pathname === "/notifications"
                ? "bg-purple-500/20 text-purple-300"
                : "text-gray-300"
            }`}
          >
            Хабарландырулар
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/profile")}
            className={`hidden md:flex px-4 py-2 rounded-lg hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-200 font-medium items-center gap-2 ${
              location.pathname === "/profile" || location.pathname === "/settings"
                ? "bg-purple-500/20 text-purple-300"
                : "text-gray-300"
            }`}
          >
            <span className="hidden sm:inline">Профиль</span>
          </button>
          <button
            onClick={() => navigate("/feedback")}
            className={`hidden md:flex px-4 py-2 rounded-lg hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-200 font-medium text-gray-300 ${
              location.pathname === "/feedback"
                ? "bg-purple-500/20 text-purple-300"
                : "text-gray-300"
            }`}
          >
          </button>
          <MobileMenu user={user} onLogout={logout} />
        </div>
      </motion.header>

      {/* Контент */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
          <motion.footer
            className="mt-auto py-6 text-center bg-slate-800/80 backdrop-blur-md border-t border-purple-500/20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-300">
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold text-brand-400">Adenly</span> — тілдерді қуанышпен үйрен
          </p>
          <div className="flex gap-6">
            <button
              onClick={() => navigate("/feedback")}
              className="text-gray-400 hover:text-purple-300 transition-colors text-sm"
            >
              Бізге хабарлаңыз
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="text-gray-400 hover:text-purple-300 transition-colors text-sm"
            >
              Параметрлер
            </button>
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
}

