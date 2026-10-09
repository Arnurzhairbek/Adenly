const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "⛔ Нет токена" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'access') return res.status(401).json({ message: 'Invalid access token' });
    req.user = decoded; // добавляем id пользователя в запрос
    next();
  } catch (err) {
    return res.status(401).json({ message: "❌ Недействительный токен" });
  }
};
