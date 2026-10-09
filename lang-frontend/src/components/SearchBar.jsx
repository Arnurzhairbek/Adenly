import { useState, useCallback, memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Input from "./ui/Input";
import Button from "./ui/Button";

function SearchBar({ 
  placeholder = "Іздеу...", 
  onSearch, 
  className = "",
  debounceMs = 300 
}) {
  const [query, setQuery] = useState("");
  const debounceTimerRef = useRef(null);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);

    // Очищаем предыдущий таймер
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Устанавливаем новый таймер для debounce
    debounceTimerRef.current = setTimeout(() => {
      onSearch?.(value);
    }, debounceMs);
  }, [onSearch, debounceMs]);

  // Очищаем таймер при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearch?.("");
  }, [onSearch]);

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleClear}
              className="text-white/50 hover:text-white transition"
              aria-label="Іздеуді тазалау"
            >
              ✕
            </motion.button>
          )}
          <span className="text-white/50">🔍</span>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(SearchBar);

