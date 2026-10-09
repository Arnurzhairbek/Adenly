import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // По умолчанию светлая тема
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return false; // По умолчанию светлая тема
  });

  useEffect(() => {
    // Применяем тему к документу при монтировании и изменении
    const root = document.documentElement;
    const body = document.body;
    
    if (isDark) {
      root.classList.add("dark");
      body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Применяем тему при первой загрузке
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const shouldBeDark = saved === "dark";
    const body = document.body;
    const root = document.documentElement;
    
    if (shouldBeDark) {
      root.classList.add("dark");
      body.classList.add("dark-theme");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark-theme");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 transition-all duration-200 hover:scale-105"
      aria-label="Тақырыпты ауыстыру"
      title={isDark ? "Жарық тақырыпқа ауысу" : "Қараңғы тақырыпқа ауысу"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0, scale: 1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="w-5 h-5"
      >
        {isDark ? (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </motion.div>
    </button>
  );
}

