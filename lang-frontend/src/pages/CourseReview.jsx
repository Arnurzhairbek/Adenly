import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "../components/Toast";
import { courses, auth } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CourseReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get("courseId");
  
  const [loading, setLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    rating: 0,
    review: "",
    title: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем курс
        if (courseId) {
          const courseData = await courses.getById(courseId);
          setCourse(courseData);
        }

        // Загружаем пользователя
        const userData = await auth.getMe();
        setUser(userData);
      } catch (err) {
        toast.error("Деректерді жүктеу қатесі");
        console.error(err);
      } finally {
        setCourseLoading(false);
      }
    };

    loadData();
  }, [courseId]);

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = "Бағалау таңдаңыз";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Тақырып бос болмауы керек";
    }

    if (!formData.review.trim()) {
      newErrors.review = "Пікір бос болмауы керек";
    } else if (formData.review.trim().length < 10) {
      newErrors.review = "Пікір кемінде 10 таңба болуы керек";
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
      // Временно сохраняем в localStorage
      const reviews = JSON.parse(localStorage.getItem("courseReviews") || "[]");
      const newReview = {
        id: Date.now(),
        course_id: parseInt(courseId),
        user_id: user?.id,
        user_name: user?.name || "Пайдаланушы",
        rating: formData.rating,
        title: formData.title,
        review: formData.review,
        createdAt: new Date().toISOString(),
      };
      reviews.push(newReview);
      localStorage.setItem("courseReviews", JSON.stringify(reviews));

      toast.success("Пікіріңіз сәтті қалдырылды! Рахмет!");
      setFormData({
        rating: 0,
        review: "",
        title: "",
      });
      setErrors({});

      // Возвращаемся к курсу
      setTimeout(() => {
        navigate(`/courses?courseId=${courseId}`);
      }, 1500);
    } catch (err) {
      toast.error("Қате орын алды. Кейінірек қайталаңыз.");
      console.error("Review қатесі:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Жүктелуде..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 flex items-center justify-center p-6">
        <Card>
          <div className="text-center">
            <p className="text-xl mb-4">Курс табылмады</p>
            <Button onClick={() => navigate("/courses")}>
              Курстарға оралу
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
            onClick={() => navigate(`/courses?courseId=${courseId}`)}
            className="mb-6"
          >
            ← Курсқа оралу
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Курсты бағалау</h1>
          <p className="text-white/70 text-lg mb-4">
            Курс: <span className="font-semibold text-white">{course.title}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Рейтинг */}
              <div>
                <label className="block text-white/80 mb-4 font-semibold">
                  Бағалау *
                </label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      className={`
                        text-5xl transition-all duration-200 transform
                        ${formData.rating >= star 
                          ? "text-yellow-400 scale-110" 
                          : "text-gray-400 hover:text-yellow-300 hover:scale-105"
                        }
                      `}
                    >
                      {formData.rating >= star ? "★" : "☆"}
                    </button>
                  ))}
                </div>
                {errors.rating && (
                  <p className="mt-2 text-sm text-red-600 font-medium text-center">
                    {errors.rating}
                  </p>
                )}
                <p className="mt-2 text-center text-white/60">
                  {formData.rating > 0 && `${formData.rating} / 5 жұлдыз`}
                </p>
              </div>

              {/* Заголовок отзыва */}
              <div>
                <label className="block text-white/80 mb-2 font-semibold">
                  Пікір тақырыбы *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Пікіріңізді қысқаша сипаттаңыз"
                  className={`
                    w-full px-4 py-3 rounded-xl
                    bg-slate-700/50 border-2 border-purple-500/30
                    text-white placeholder-gray-400
                    focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                    outline-none transition-all duration-200
                    hover:border-neutral-400
                    ${errors.title ? "border-red-500 focus:ring-red-500" : ""}
                  `}
                  required
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.title}</p>
                )}
              </div>

              {/* Текст отзыва */}
              <div>
                <label className="block text-white/80 mb-2 font-semibold">
                  Пікір *
                </label>
                <textarea
                  name="review"
                  value={formData.review}
                  onChange={handleChange}
                  placeholder="Курс туралы пікіріңізді жазыңыз..."
                  rows={6}
                  className={`
                    w-full px-4 py-3 rounded-xl
                    bg-slate-700/50 border-2 border-purple-500/30
                    text-white placeholder-gray-400
                    focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                    outline-none transition-all duration-200
                    hover:border-neutral-400
                    resize-none
                    ${errors.review ? "border-red-500 focus:ring-red-500" : ""}
                  `}
                  required
                />
                {errors.review && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.review}</p>
                )}
                <p className="mt-2 text-sm text-white/60">
                  {formData.review.length} / 1000 таңба
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
                  {loading ? "Сақталуда..." : "Пікірді сақтау"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

