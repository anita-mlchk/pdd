require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const { Ticket, User } = require('./models');

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_12345';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Доступ запрещен: токен не предоставлен' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный или истекший токен' });
    }
    req.user = decoded;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Доступ запрещен: требуется роль администратора' });
  }
};

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Заполните email и пароль' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      role: role || 'user'
    });

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      userId: user.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    ); 

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при авторизации' });
  }
});

app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role', 'createdAt']
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения данных профиля' });
  }
});

app.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'role', 'createdAt'] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения списка пользователей' });
  }
});

app.get('/tickets', async (req, res) => {
  try {
    const { category } = req.query;
    const whereClause = category ? { category } : {};

    const tickets = await Ticket.findAll({ where: whereClause });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении билетов' });
  }
});

app.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/tickets', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, category, questionsCount, timeLimitMinutes, description } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Поля "title" и "category" обязательны' });
    }

    const newTicket = await Ticket.create({
      title,
      category,
      questionsCount: questionsCount || 20,
      timeLimitMinutes: timeLimitMinutes || 20,
      description: description || ''
    });

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании билета' });
  }
});

app.put('/tickets/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, category, questionsCount, timeLimitMinutes, description } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Поля "title" и "category" обязательны' });
    }

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }

    await ticket.update({
      title,
      category,
      questionsCount: questionsCount || 20,
      timeLimitMinutes: timeLimitMinutes || 20,
      description: description || ''
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении билета' });
  }
});

app.delete('/tickets/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }

    await ticket.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении билета' });
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});