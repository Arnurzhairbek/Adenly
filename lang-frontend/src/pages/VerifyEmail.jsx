import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../api";
import { toast } from "../components/Toast";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");

  useEffect(() => {
    console.log("[VerifyEmail] Компонент загружен");
    console.log("[VerifyEmail] Токен из URL:", token ? `${token.substring(0, 20)}...` : "ОТСУТСТВУЕТ");
    
    // Проверяем наличие токена
    if (!token || token.trim() === "") {
      console.error("[VerifyEmail] Токен отсутствует в URL");
      setStatus("error");
      setMessage("Растау токені табылмады");
      setErrorDetails("URL-да токен жоқ. Поштадағы сілтемені тексеріңіз.");
      return;
    }

    const verify = async () => {
      try {
        console.log("[VerifyEmail] Попытка подтверждения email с токеном:", token?.substring(0, 20) + "...");
        const data = await auth.verifyEmail(token);
        
        console.log("[VerifyEmail] Ответ от сервера:", data);
        setStatus("success");
        setMessage(data.message || "Email сәтті расталды!");
        toast.success(data.message || "Email сәтті расталды!");
        
        // Автоматический редирект на страницу входа через 3 секунды
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (err) {
        console.error("[VerifyEmail] Ошибка подтверждения:", err);
        
        setStatus("error");
        
        // Более детальная обработка ошибок
        let errorMessage = "Email растау қатесі.";
        let details = "";
        
        if (err.message) {
          errorMessage = err.message;
          
          // Проверяем тип ошибки
          if (err.message.includes("истекшая") || err.message.includes("expired")) {
            errorMessage = "Растау сілтемесінің мерзімі өткен";
            details = "Жаңа растау сілтемесін алу үшін қайта тіркеліңіз немесе қолдау қызметімен байланысыңыз.";
          } else if (err.message.includes("недействительная") || err.message.includes("invalid")) {
            errorMessage = "Растау сілтемесі жарамсыз";
            details = "Поштадағы сілтемені дұрыс көшіріп қойғаныңызды тексеріңіз.";
          } else if (err.message.includes("уже подтверждён") || err.message.includes("already verified")) {
            errorMessage = "Email әлдеқашан расталған";
            details = "Сіз әлдеқашан тіркелгенсіз. Кіру бетіне өтіп, жүйеге кіре аласыз.";
          } else if (err.message.includes("не найден") || err.message.includes("not found")) {
            errorMessage = "Пайдаланушы табылмады";
            details = "Тіркелген пайдаланушы жоқ. Қайта тіркеліңіз.";
          }
        }
        
        setMessage(errorMessage);
        setErrorDetails(details);
        toast.error(errorMessage);
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white p-6">
      <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_0_30px_rgba(99,102,241,0.5)] p-10 max-w-md w-full text-center overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />

        {status === "loading" && (
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-14 h-14 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-semibold mb-2">Email-іңізді тексеруде...</h2>
            <p className="text-white/70">Бірнеше секунд күтіңіз</p>
            {token && (
              <p className="text-white/50 text-xs mt-2">Токен: {token.substring(0, 20)}...</p>
            )}
          </motion.div>
        )}

        {status === "success" && (
          <div className="animate-fadeInUp">
            <h2 className="text-2xl font-bold text-indigo-400 mb-3 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]">
              Email расталды!
            </h2>
            <p className="text-white/80 mb-6">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.8)] hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Кіруге өту
            </button>
          </div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="animate-fadeInUp"
          >
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-3">
              Растау қатесі
            </h2>
            <p className="text-white/80 mb-4">{message}</p>
            {errorDetails && (
              <p className="text-white/60 text-sm mb-6 bg-white/5 rounded-lg p-3">
                {errorDetails}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.8)] hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Қайта тіркелу
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-2 bg-white/10 border border-white/20 text-white font-semibold rounded-xl shadow-md hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Кіру бетіне өту
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
