const express = require('express');
const User = require('../models/user');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email role createdAt');
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка получения данных профиля' });
  }
});

router.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('email role createdAt');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка получения списка пользователей' });
  }
});

module.exports = router;
