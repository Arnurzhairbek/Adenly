// Скрипт для проверки переменных окружения
require("dotenv").config();

console.log("=== Проверка переменных окружения ===");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "❌ НЕ УСТАНОВЛЕНА");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Установлена" : "❌ НЕ УСТАНОВЛЕНА");
console.log("PORT:", process.env.PORT || "5000 (по умолчанию)");
console.log("\n=== Если FRONTEND_URL не установлена ===");
console.log("1. Откройте файл lang-backend/.env");
console.log("2. Добавьте строку: FRONTEND_URL=https://monkey-attorneys-perfect-attempt.trycloudflare.com");
console.log("3. Перезапустите backend сервер");

