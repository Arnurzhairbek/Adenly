import { motion } from "framer-motion";

// Анимированная иконка Play Circle
export function AnimatedPlayCircle({ size = 60, color = "#a855f7" }) {
  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Внешний круг с пульсацией */}
        <motion.circle
          cx="30"
          cy="30"
          r="28"
          stroke={color}
          strokeWidth="2"
          fill="none"
          opacity="0.3"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Основной круг */}
        <circle cx="30" cy="30" r="25" fill={color} opacity="0.1" />
        <circle cx="30" cy="30" r="20" fill={color} />
        {/* Play треугольник */}
        <motion.polygon
          points="24,18 24,42 40,30"
          fill="white"
          initial={{ x: -1 }}
          animate={{ x: [0, 2, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </motion.div>
  );
}

// Анимированная иконка Assignment
export function AnimatedAssignment({ size = 60, color = "#a855f7" }) {
  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Фон */}
        <motion.rect
          x="10"
          y="8"
          width="40"
          height="44"
          rx="4"
          fill={color}
          opacity="0.1"
          animate={{
            y: [8, 10, 8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <rect x="10" y="8" width="40" height="44" rx="4" fill={color} />
        
        {/* Линии текста */}
        <motion.line
          x1="18"
          y1="20"
          x2="42"
          y2="20"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        <motion.line
          x1="18"
          y1="28"
          x2="38"
          y2="28"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        />
        <motion.line
          x1="18"
          y1="36"
          x2="35"
          y2="36"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        />
        
        {/* Галочка */}
        <motion.path
          d="M20 45 L26 50 L40 32"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        />
      </svg>
    </motion.div>
  );
}

// Анимированная иконка Calendar
export function AnimatedCalendar({ size = 60, color = "#a855f7" }) {
  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Календарь */}
        <rect x="12" y="10" width="36" height="40" rx="3" fill={color} />
        <rect x="12" y="10" width="36" height="12" fill={color} opacity="0.7" />
        
        {/* Скрепка */}
        <motion.rect
          x="18"
          y="6"
          width="6"
          height="8"
          rx="1"
          fill={color}
          animate={{
            y: [6, 8, 6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.rect
          x="36"
          y="6"
          width="6"
          height="8"
          rx="1"
          fill={color}
          animate={{
            y: [6, 8, 6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />
        
        {/* Дни недели */}
        <motion.circle
          cx="20"
          cy="30"
          r="3"
          fill="white"
          opacity="0.8"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0,
          }}
        />
        <motion.circle
          cx="30"
          cy="30"
          r="3"
          fill="white"
          opacity="0.8"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.3,
          }}
        />
        <motion.circle
          cx="40"
          cy="30"
          r="3"
          fill="white"
          opacity="0.8"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.6,
          }}
        />
        
        {/* Бейдж "5+" */}
        <motion.circle
          cx="45"
          cy="15"
          r="8"
          fill="#8b5cf6"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <text
          x="45"
          y="18"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
        >
          5+
        </text>
      </svg>
    </motion.div>
  );
}

// Анимированная звезда
export function AnimatedStar({ size = 80, color = "#8b5cf6" }) {
  return (
    <motion.div
      animate={{
        rotate: [0, 180, 360],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M30 5 L35 22 L52 22 L38 33 L43 50 L30 38 L17 50 L22 33 L8 22 L25 22 Z"
          fill={color}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Внутренняя звезда */}
        <motion.path
          d="M30 12 L33 22 L43 22 L35 28 L38 38 L30 32 L22 38 L25 28 L17 22 L27 22 Z"
          fill={color}
          opacity="0.6"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </motion.div>
  );
}

// Анимированная иконка Check Circle
export function AnimatedCheckCircle({ size = 24, color = "#8b5cf6" }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M8 12 L11 15 L16 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.svg>
  );
}

