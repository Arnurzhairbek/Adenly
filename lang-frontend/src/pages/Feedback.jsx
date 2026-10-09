import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "../components/Toast";
import { feedback } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Feedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general", // general, bug, feature, other
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Аты бос болмауы керек";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email бос болмауы керек";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email форматы дұрыс емес";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Тақырып бос болмауы керек";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Хабарлама бос болмауы керек";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Хабарлама кемінде 10 таңба болуы керек";
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

    setLoading(true);

    try {
      await feedback.submit({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        category: formData.category,
      });

      toast.success("Пікіріңіз сәтті жіберілді! Рахмет!");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general",
      });
      setErrors({});

      // Перенаправляем через 2 секунды
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      toast.error(err.message || "Қате орын алды. Кейінірек қайталаңыз.");
      console.error("Feedback қатесі:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку при изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-6 text-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
            className="mb-6"
          >
            ← Басты бетке оралу
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Бізге хабарлаңыз</h1>
          <p className="text-white/70 text-lg">
            Пікірлеріңіз, ұсыныстарыңыз немесе мәселелеріңіз туралы бізге хабарлаңыз
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Категория */}
              <div>
                <label className="block text-white/80 mb-2 font-semibold">
                  Категория
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border-2 border-purple-500/30 text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all duration-200"
                >
                  <option value="general">Жалпы сұрау</option>
                  <option value="bug">Қате туралы хабарлау</option>
                  <option value="feature">Жаңа функция ұсыну</option>
                  <option value="other">Басқа</option>
                </select>
              </div>

              {/* Имя */}
              <Input
                label="Атыңыз"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Атыңызды енгізіңіз"
                error={errors.name}
                required
              />

              {/* Email */}
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                error={errors.email}
                required
              />

              {/* Тема */}
              <Input
                label="Тақырып"
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Хабарламаның тақырыбы"
                error={errors.subject}
                required
              />

              {/* Сообщение */}
              <div>
                <label className="block text-white/80 mb-2 font-semibold">
                  Хабарлама *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Пікіріңізді, ұсынысыңызды немесе мәселені сипаттаңыз..."
                  rows={8}
                  className={`
                    w-full px-4 py-3 rounded-xl
                    bg-slate-700/50 border-2 border-purple-500/30
                    text-white placeholder-gray-400
                    focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                    outline-none transition-all duration-200
                    hover:border-neutral-400
                    resize-none
                    ${errors.message ? "border-red-500 focus:ring-red-500" : ""}
                  `}
                  required
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.message}</p>
                )}
                <p className="mt-2 text-sm text-white/60">
                  {formData.message.length} / 1000 таңба
                </p>
              </div>

              {/* Кнопка отправки */}
              <div className="pt-4 border-t border-white/10">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? "Жіберілуде..." : "📤 Хабарламаны жіберу"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {loading && (
          <div className="mt-6 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        )}
      </div>
    </div>
  );
}

