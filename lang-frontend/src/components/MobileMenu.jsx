import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { path: "/home", label: "Басты бет", icon: null },
    { path: "/courses", label: "Барлық курстар", icon: null, group: "Курстар" },
    { path: "/progress", label: "Менің прогрессім", icon: null, group: "Курстар" },
    { path: "/achievements", label: "Жетістіктер", icon: null, group: "Рейтинг" },
    { path: "/leaderboard", label: "Көшбасшылар кестесі", icon: null, group: "Рейтинг" },
    { path: "/notifications", label: "Хабарландырулар", icon: null },
    { path: "/profile", label: "Профиль", icon: null },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Кнопка меню */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
        aria-label="Мәзір"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Мобильное меню */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Меню */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl z-50 md:hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-yellow-300">
                    Adenly
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>

                <nav className="space-y-3">
                  {menuItems.map((item, index) => {
                    // Показываем заголовок группы перед первым элементом группы
                    const showGroupHeader = item.group && 
                      (index === 0 || menuItems[index - 1]?.group !== item.group);
                    
                    return (
                      <div key={item.path}>
                        {showGroupHeader && (
                          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {item.group}
                          </div>
                        )}
                        <button
                          onClick={() => handleNavigate(item.path)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-white/10 transition text-white ${
                            item.group ? "ml-4" : ""
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      </div>
                    );
                  })}
                </nav>

                <div className="mt-8 pt-8 border-t border-white/20">
                  {user && (
                    <p className="text-white/70 mb-4 px-4">
                      {user.name || user.email}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition"
                  >
                    Шығу
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

