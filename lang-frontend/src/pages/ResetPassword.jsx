import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { auth } from "../api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirm) {
      setError("Құпия сөздер сәйкес келмейді");
      return;
    }

    try {
      const data = await auth.resetPassword(token, newPassword);
      setMessage(data.message || "Құпия сөз сәтті жаңартылды! Енді сіз бағытталасыз...");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message || "Сервер қатесі. Кейінірек көріңіз.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_0_25px_rgba(99,102,241,0.5)] p-8">
        <h2 className="text-3xl font-extrabold text-white text-center mb-6 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
          Құпия сөзді қалпына келтіру
        </h2>

        {message && (
          <div className="bg-green-500/80 text-white text-center p-3 rounded-lg mb-4 shadow-lg animate-pulse">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/80 text-white text-center p-3 rounded-lg mb-4 shadow-lg">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Жаңа құпия сөз"
            className="w-full px-4 py-3 rounded-xl bg-white/80 focus:bg-white outline-none text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-400 transition"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Құпия сөзді растаңыз"
            className="w-full px-4 py-3 rounded-xl bg-white/80 focus:bg-white outline-none text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-400 transition"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-3 mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.6)] hover:shadow-[0_0_35px_rgba(99,102,241,0.9)] hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Құпия сөзді қалпына келтіру
          </button>
        </form>

        <p className="text-center text-white/80 mt-6">
          Құпия сөзді еске түсірдіңіз бе?{" "}
          <Link
            to="/login"
            className="text-indigo-300 font-semibold hover:text-indigo-200 hover:underline transition"
          >
            Кіру
          </Link>
        </p>
      </div>
    </div>
  );
}
