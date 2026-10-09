const authenticate = require('./authMiddleware');
module.exports = (req, res, next) => authenticate(req, res, () => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
});
