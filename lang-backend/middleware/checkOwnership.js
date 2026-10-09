// Middleware для проверки, что пользователь работает только со своими данными

module.exports = (req, res, next) => {
  const requestedUserId = parseInt(req.params.user_id || req.body.user_id);
  const authenticatedUserId = req.user?.id;

  if (!authenticatedUserId) {
    return res.status(401).json({ message: "Не авторизован" });
  }

  // Пользователь может работать только со своими данными (если не админ)
  if (requestedUserId && authenticatedUserId !== requestedUserId && req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: "Нет доступа: вы можете работать только со своими данными" 
    });
  }

  next();
};

