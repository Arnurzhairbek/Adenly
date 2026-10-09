import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { notifications } from "../api";
import { toast } from "../components/Toast";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { translateNotification } from "../utils/translator";
import { formatDateTimeKZ } from "../utils/dateFormatter";

export default function Notifications() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notifications.getAll();
        setNotes(data || []);
      } catch (err) {
        console.error("Хабарландыруларды жүктеу қатесі:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    // Оптимистично обновляем UI
    const previousNotes = [...notes];
    setNotes(notes.map(n => n.id === id ? { ...n, is_read: true } : n));
    
    try {
      await notifications.markAsRead(id);
      toast.success("Хабарландыру оқылған деп белгіленді");
    } catch (err) {
      // Откатываем изменение при ошибке
      setNotes(previousNotes);
      toast.error("Хабарландыруды жаңарту қатесі");
      console.error("Хабарландыруды жаңарту қатесі:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notes.filter(n => !n.is_read);
    if (unread.length === 0) return;
    
    // Оптимистично обновляем UI
    const previousNotes = [...notes];
    setNotes(notes.map(n => ({ ...n, is_read: true })));
    
    try {
      // Отмечаем все уведомления как прочитанные
      await Promise.all(unread.map(note => notifications.markAsRead(note.id)));
      toast.success("Барлық хабарландырулар оқылған деп белгіленді");
    } catch (err) {
      // Откатываем изменение при ошибке
      setNotes(previousNotes);
      toast.error("Хабарландыруларды жаңарту қатесі");
      console.error("Хабарландыруларды жаңарту қатесі:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Хабарландыруларды жүктеу..." />
      </div>
    );
  }

  const unreadCount = notes.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <motion.h1
            className="text-5xl font-bold text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Хабарландырулар
            {unreadCount > 0 && (
              <Badge variant="danger" className="ml-3">
                {unreadCount} жаңа
              </Badge>
            )}
          </motion.h1>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              Барлығын оқылған деп белгілеу
            </Button>
          )}
        </div>
        
        {notes.length === 0 ? (
          <Card>
            <EmptyState
              icon={null}
              title="Хабарландырулар жоқ"
              description="Мұнда прогрессіңіз және жетістіктеріңіз туралы маңызды хабарландырулар көрсетіледі"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {notes.map((n, index) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`${n.is_read ? "bg-purple-600/20 backdrop-blur-sm border-2 border-purple-400/30" : "border-l-4 border-purple-500 bg-purple-600/30 backdrop-blur-sm shadow-sm"}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-lg font-semibold text-white">{translateNotification(n.message)}</p>
                        {!n.is_read && (
                          <Badge variant="warning">Жаңа</Badge>
                        )}
                        {n.type && (
                          <Badge variant="info">{n.type}</Badge>
                        )}
                      </div>
                      {n.created_at && (
                        <p className="text-sm text-purple-200">
                          {formatDateTimeKZ(n.created_at)}
                        </p>
                      )}
                    </div>
                    {!n.is_read && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleMarkAsRead(n.id)}
                      >
                        ✓ Оқылды
                      </Button>
                    )}
                    {n.is_read && (
                      <Badge variant="success">Оқылды</Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
