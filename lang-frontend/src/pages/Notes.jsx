import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "../components/Toast";
import { auth, lessons } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/ui/Modal";
import { formatDateTimeKZ } from "../utils/dateFormatter";

export default function Notes() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessonId = searchParams.get("lessonId");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await auth.getMe();
        setUser(userData);

        if (lessonId) {
          const lessonData = await lessons.getById(lessonId);
          setLesson(lessonData);
        }

        // Загружаем заметки из localStorage
        const savedNotes = JSON.parse(localStorage.getItem("userNotes") || "[]");
        const filteredNotes = lessonId 
          ? savedNotes.filter(n => n.lesson_id === parseInt(lessonId))
          : savedNotes;
        setNotes(filteredNotes);
      } catch (err) {
        toast.error("Деректерді жүктеу қатесі");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [lessonId]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Тақырып бос болмауы керек";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Мазмұн бос болмауы керек";
    } else if (formData.content.trim().length < 5) {
      newErrors.content = "Мазмұн кемінде 5 таңба болуы керек";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Барлық өрістерді дұрыс толтырыңыз");
      return;
    }

    setSaving(true);

    try {
      const allNotes = JSON.parse(localStorage.getItem("userNotes") || "[]");
      
      if (editingNote) {
        // Редактирование существующей заметки
        const index = allNotes.findIndex(n => n.id === editingNote.id);
        if (index !== -1) {
          allNotes[index] = {
            ...allNotes[index],
            title: formData.title,
            content: formData.content,
            tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
            updatedAt: new Date().toISOString(),
          };
        }
        toast.success("Жаңалық сәтті жаңартылды!");
      } else {
        // Создание новой заметки
        const newNote = {
          id: Date.now(),
          user_id: user?.id,
          lesson_id: lessonId ? parseInt(lessonId) : null,
          title: formData.title,
          content: formData.content,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        allNotes.push(newNote);
        toast.success("Жаңалық сәтті құрылды!");
      }

      localStorage.setItem("userNotes", JSON.stringify(allNotes));

      // Обновляем список заметок
      const filteredNotes = lessonId 
        ? allNotes.filter(n => n.lesson_id === parseInt(lessonId))
        : allNotes;
      setNotes(filteredNotes);

      // Очищаем форму
      setFormData({
        title: "",
        content: "",
        tags: "",
      });
      setEditingNote(null);
      setIsModalOpen(false);
      setErrors({});
    } catch (err) {
      toast.error("Қате орын алды. Кейінірек қайталаңыз.");
      console.error("Notes қатесі:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags.join(", "),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (noteId) => {
    if (!window.confirm("Жаңалықты жоюға сенімдісіз бе?")) {
      return;
    }

    try {
      const allNotes = JSON.parse(localStorage.getItem("userNotes") || "[]");
      const filteredNotes = allNotes.filter(n => n.id !== noteId);
      localStorage.setItem("userNotes", JSON.stringify(filteredNotes));

      // Обновляем список заметок
      const updatedNotes = lessonId 
        ? filteredNotes.filter(n => n.lesson_id === parseInt(lessonId))
        : filteredNotes;
      setNotes(updatedNotes);

      toast.success("Жаңалық жойылды");
    } catch (err) {
      toast.error("Жаңалықты жою қатесі");
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setFormData({
      title: "",
      content: "",
      tags: "",
    });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Жүктелуде..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            ← Артқа
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Жаңалықтар</h1>
              <p className="text-white/70 text-lg">
                {lesson 
                  ? `Сабақ: ${lesson.title}` 
                  : "Барлық жаңалықтар"}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
            >
              + Жаңа жаңалық
            </Button>
          </div>
        </motion.div>

        {notes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="text-center py-12">
                <h3 className="text-2xl font-semibold mb-2">Жаңалықтар жоқ</h3>
                <p className="text-white/70 mb-6">
                  {lesson 
                    ? "Осы сабақ үшін әлі жаңалық қосылмаған" 
                    : "Сіз әлі жаңалық қосмағансыз"}
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  + Алғашқы жаңалықты қосу
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">{note.title}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(note)}
                            title="Редактировать"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(note.id)}
                            title="Удалить"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </div>

                      <p className="text-white/80 mb-4 line-clamp-4">
                        {note.content}
                      </p>

                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {note.tags.map((tag, i) => (
                            <Badge key={i} variant="info" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/10 text-sm text-white/60">
                      {note.updatedAt 
                        ? formatDateTimeKZ(note.updatedAt)
                        : formatDateTimeKZ(note.createdAt)}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Модальное окно для создания/редактирования заметки */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingNote ? "Жаңалықты өңдеу" : "Жаңа жаңалық"}
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Заголовок */}
            <Input
              label="Тақырып *"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Жаңалық тақырыбы"
              error={errors.title}
              required
            />

            {/* Содержимое */}
            <div>
              <label className="block text-white/80 mb-2 font-semibold">
                Мазмұн *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Жаңалық мазмұнын жазыңыз..."
                rows={8}
                className={`
                  w-full px-4 py-3 rounded-xl
                  bg-slate-700/50 border-2 border-purple-500/30
                  text-white placeholder-gray-400
                  focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                  outline-none transition-all duration-200
                  hover:border-neutral-400
                  resize-none
                  ${errors.content ? "border-red-500 focus:ring-red-500" : ""}
                `}
                required
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.content}</p>
              )}
            </div>

            {/* Теги */}
            <Input
              label="Тегтер (бірінен кейін бірі қойып, үтірмен бөліңіз)"
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="тег1, тег2, тег3"
            />

            {/* Кнопки */}
            <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                disabled={saving}
              >
                Болдырмау
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                disabled={saving}
              >
                {saving 
                  ? "Сақталуда..." 
                  : editingNote 
                    ? "Жаңарту" 
                    : "Сақтау"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

