import { motion } from "framer-motion";

export default function ProgressChart({ data, label, color = "indigo" }) {
  // Проверяем, что data это массив и не пустой
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const colors = {
    indigo: "from-indigo-500 to-purple-500",
    green: "from-green-500 to-emerald-500",
    blue: "from-blue-500 to-cyan-500",
    yellow: "from-yellow-500 to-orange-500",
  };

  // Безопасное вычисление maxValue
  const values = data.map(d => (d && typeof d.value === 'number' ? d.value : 0));
  const maxValue = Math.max(...values, 1);
  const barWidth = 100 / data.length;

  return (
    <div className="w-full">
      {label && <h3 className="text-lg font-semibold mb-4">{label}</h3>}
      <div className="relative h-64 flex items-end gap-2">
        {data.map((item, index) => {
          const value = item && typeof item.value === 'number' ? item.value : 0;
          const height = (value / maxValue) * 100;
          return (
            <motion.div
              key={index}
              className="flex-1 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="w-full flex flex-col items-center h-full justify-end">
                <motion.div
                  className={`w-full rounded-t-lg bg-gradient-to-t ${colors[color]} shadow-lg`}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  style={{ minHeight: height > 0 ? "4px" : "0" }}
                />
              </div>
              {item.label && (
                <p className="text-xs text-white/70 mt-2 text-center truncate w-full">
                  {item.label}
                </p>
              )}
              {value > 0 && (
                <p className="text-xs font-semibold text-white mt-1">
                  {value}%
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function LineChart({ data, label, color = "indigo" }) {
  if (data.length < 2) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);

  // Мәндерді 0-ден 100-ге дейін нормализациялау
  const normalized = data.map(d => ({
    ...d,
    normalized: ((d.value - minValue) / (maxValue - minValue || 1)) * 100,
  }));

  // Вычисляем точки для SVG path
  const width = 100;
  const height = 100;
  const stepX = width / (normalized.length - 1);
  
  const points = normalized.map((d, i) => [
    i * stepX,
    height - d.normalized,
  ]);

  const pathD = points.reduce((acc, [x, y], i) => {
    return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  }, "");

  const colors = {
    indigo: "#6366f1",
    green: "#10b981",
    blue: "#3b82f6",
    yellow: "#eab308",
  };

  return (
    <div className="w-full">
      {label && <h3 className="text-lg font-semibold mb-4">{label}</h3>}
      <div className="relative w-full h-64 bg-white/5 rounded-lg p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Сетка */}
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors[color]} stopOpacity="0.4" />
              <stop offset="100%" stopColor={colors[color]} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Заполнение под линией */}
          <path
            d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
            fill={`url(#gradient-${color})`}
          />
          
          {/* Линия */}
          <motion.path
            d={pathD}
            fill="none"
            stroke={colors[color]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          
          {/* Точки */}
          {points.map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={colors[color]}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            />
          ))}
        </svg>
        
        {/* Подписи */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-white/50 px-2 pb-2">
          {normalized.map((d, i) => (
            <span key={i} className="truncate" style={{ width: `${100 / normalized.length}%` }}>
              {d.label || i}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

