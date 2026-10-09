import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const data = await auth.forgotPassword(email);
      setMessage(data.message || "📩 Құпия сөзді қалпына келтіру сілтемесі поштаңызға жіберілді!");
      setEmail("");
    } catch (err) {
      setError(err.message || "Сервер қатесі. Кейінірек көріңіз.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-4 text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.4)] p-8 border border-white/10">
        <h2 className="text-4xl font-extrabold text-center mb-8 tracking-wide">
          <span className="text-indigo-400">Құпия сөзді</span> қалпына келтіру
        </h2>

        {message && (
          <div className="bg-green-500/80 text-white text-center p-3 rounded-lg mb-4 shadow-lg animate-pulse">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-600/80 text-white text-center p-3 rounded-lg mb-4 shadow-lg animate-pulse">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email енгізіңіз"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_rgba(99,102,241,0.8)] hover:scale-105 active:scale-95 transition-transform duration-200"
          >
            Сілтемені жіберу
          </button>
        </form>

        <p className="text-center text-white/70 mt-6">
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
