import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { leaderboard } from "../api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const data = await leaderboard.getAll();
        setLeaders(data || []);
      } catch (err) {
        console.error("Көшбасшылар кестесін жүктеу қатесі:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Көшбасшылар кестесін жүктеу..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          className="text-4xl font-bold mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Көшбасшылар кестесі
        </motion.h1>
        
        {leaders.length > 0 ? (
          <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
            <div className="space-y-4">
              {leaders.map((user, index) => (
                <motion.div
                  key={user.user_id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    flex justify-between items-center p-5 rounded-lg
                    ${index === 0 ? 'bg-yellow-500/20 border-2 border-yellow-400 shadow-yellow-500/50 shadow-lg' :
                      index === 1 ? 'bg-gray-400/20 border-2 border-gray-300 shadow-gray-400/50 shadow-lg' :
                      index === 2 ? 'bg-orange-600/20 border-2 border-orange-500 shadow-orange-500/50 shadow-lg' :
                      'bg-white/5 border border-white/20 hover:bg-white/10 transition'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold w-12 text-center">
                      {`${index + 1}.`}
                    </span>
                    <div>
                      <p className="text-xl font-bold">{user.username || "Пайдаланушы"}</p>
                      {index < 3 && (
                        <Badge variant={index === 0 ? "warning" : index === 1 ? "default" : "warning"} className="mt-1">
                          {index === 0 ? "Чемпион" : index === 1 ? "Екінші орын" : "Үшінші орын"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-300">
                      {user.completed_lessons || 0}
                    </p>
                    <p className="text-sm text-white/70">сабақ</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30">
            <EmptyState
              icon={null}
              title="Көшбасшылар кестесі әлі бос"
              description="Көшбасшылар кестесінде бірінші болыңыз! Курстарды зерттеуді бастаңыз."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
