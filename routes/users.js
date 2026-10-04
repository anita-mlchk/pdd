const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role', 'createdAt']
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения данных профиля' });
  }
});

router.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'role', 'createdAt'] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения списка пользователей' });
  }
});

module.exports = router;