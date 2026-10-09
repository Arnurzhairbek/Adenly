import { useMemo } from "react";
import { motion } from "framer-motion";
import Card from "./ui/Card";

/**
 * Компонент календаря активности пользователя
 * Показывает дни с активностью обучения
 * @param {Array} progressData - Массив данных о прогрессе с полями updated_at
 * @param {Number} monthsToShow - Количество месяцев для отображения (по умолчанию 3)
 */
export default function ActivityCalendar({ progressData = [], monthsToShow = 3 }) {
  // Группируем прогресс по дням
  const activityByDate = useMemo(() => {
    const activityMap = new Map();
    
    progressData.forEach((item) => {
      if (item.updated_at) {
        const date = new Date(item.updated_at);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!activityMap.has(dateKey)) {
          activityMap.set(dateKey, {
            date: dateKey,
            count: 0,
            completed: 0
          });
        }
        
        const dayData = activityMap.get(dateKey);
        dayData.count += 1;
        if (item.completed) {
          dayData.completed += 1;
        }
      }
    });
    
    return activityMap;
  }, [progressData]);

  // Генерируем календарь за последние N месяцев
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - monthsToShow);
    startDate.setDate(1); // Начинаем с первого числа месяца
    
    const currentDate = new Date(startDate);
    
    // Заполняем дни недели до первого дня месяца
    const firstDayOfWeek = startDate.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: null, isEmpty: true });
    }
    
    // Заполняем все дни месяцев
    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const activity = activityByDate.get(dateKey);
      
      days.push({
        date: new Date(currentDate),
        dateKey,
        isEmpty: false,
        hasActivity: !!activity,
        count: activity?.count || 0,
        completed: activity?.completed || 0,
        isToday: dateKey === today.toISOString().split('T')[0],
        isFuture: currentDate > today
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [activityByDate, monthsToShow]);

  // Определяем уровень активности для цвета
  const getActivityLevel = (count) => {
    if (!count) return 0;
    if (count >= 5) return 4; // Очень высокая активность
    if (count >= 3) return 3; // Высокая активность
    if (count >= 2) return 2; // Средняя активность
    return 1; // Низкая активность
  };

  // Получаем цвет для дня в зависимости от активности
  const getActivityColor = (day) => {
    if (day.isFuture) return "bg-slate-700/30";
    if (!day.hasActivity) return "bg-slate-800/40";
    
    const level = getActivityLevel(day.count);
    const colors = [
      "bg-green-500/20", // Низкая
      "bg-green-500/40", // Средняя
      "bg-green-500/60", // Высокая
      "bg-green-500/80"  // Очень высокая
    ];
    return colors[level - 1] || colors[0];
  };

  // Названия дней недели
  const weekDays = ["Жс", "Дс", "Сс", "Ср", "Бс", "Жм", "Сб"];
  
  // Названия месяцев
  const monthNames = [
    "Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым",
    "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"
  ];

  // Группируем дни по месяцам
  const months = useMemo(() => {
    const monthGroups = new Map();
    
    calendarDays.forEach((day) => {
      if (day.isEmpty || !day.date) return;
      
      const monthKey = `${day.date.getFullYear()}-${day.date.getMonth()}`;
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, {
          year: day.date.getFullYear(),
          month: day.date.getMonth(),
          days: []
        });
      }
      
      monthGroups.get(monthKey).days.push(day);
    });
    
    return Array.from(monthGroups.values());
  }, [calendarDays]);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">📅 Белсенділік күнтізбесі</h3>
        <p className="text-gray-300 text-sm">
          Соңғы {monthsToShow} айдың оқу белсенділігіңіз
        </p>
      </div>

      {/* Легенда */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Аз</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-slate-800/40"></div>
            <div className="w-3 h-3 rounded bg-green-500/20"></div>
            <div className="w-3 h-3 rounded bg-green-500/40"></div>
            <div className="w-3 h-3 rounded bg-green-500/60"></div>
            <div className="w-3 h-3 rounded bg-green-500/80"></div>
          </div>
          <span className="text-xs text-gray-400">Көп</span>
        </div>
      </div>

      {/* Календарь по месяцам */}
      <div className="space-y-8">
        {months.map((month) => (
          <motion.div
            key={`${month.year}-${month.month}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h4 className="text-lg font-semibold text-white mb-4">
              {monthNames[month.month]} {month.year}
            </h4>
            
            {/* Дни недели заголовки */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className="text-center text-xs font-medium text-gray-400 p-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Дни месяца */}
            <div className="grid grid-cols-7 gap-1">
              {month.days.map((day, index) => {
                // Выравниваем первый день месяца по дню недели
                const dayOfWeek = day.date.getDay();
                const isFirstInMonth = index === 0 || 
                  month.days[index - 1]?.date?.getMonth() !== day.date.getMonth();
                
                return (
                  <motion.div
                    key={day.dateKey || index}
                    className={`
                      aspect-square rounded-lg p-1 flex flex-col items-center justify-center
                      ${getActivityColor(day)}
                      ${day.isToday ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900" : ""}
                      ${!day.isFuture && day.hasActivity ? "cursor-pointer hover:scale-110 transition-transform" : ""}
                    `}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.01, type: "spring", stiffness: 200 }}
                    whileHover={day.hasActivity ? { scale: 1.1, zIndex: 10 } : {}}
                    title={
                      day.hasActivity
                        ? `${day.dateKey}: ${day.count} сабақ (${day.completed} аяқталған)`
                        : day.dateKey || ""
                    }
                    style={isFirstInMonth && index > 0 ? { gridColumnStart: dayOfWeek + 1 } : {}}
                  >
                    <span
                      className={`
                        text-xs font-medium
                        ${day.isToday ? "text-purple-300" : day.hasActivity ? "text-white" : "text-gray-500"}
                      `}
                    >
                      {day.date.getDate()}
                    </span>
                    {day.hasActivity && (
                      <span className="text-[8px] text-green-300 mt-0.5">
                        {day.count}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Статистика */}
      <div className="mt-6 pt-6 border-t border-purple-500/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">
              {Array.from(activityByDate.values()).length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Белсенді күндер</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              {Array.from(activityByDate.values()).reduce((sum, day) => sum + day.count, 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Барлығы сабақ</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {Array.from(activityByDate.values()).reduce((sum, day) => sum + day.completed, 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Аяқталған</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">
              {monthsToShow}
            </p>
            <p className="text-xs text-gray-400 mt-1">Ай көрсетілген</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

