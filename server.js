require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

if (!process.env.JWT_SECRET) {
  console.error('Ошибка: не задан JWT_SECRET. Проверьте файл .env в корне проекта.');
  process.exit(1);
}

const app = express();

app.use(cors());          // разрешаем запросы с React-приложения (другой порт)
app.use(express.json());

app.use('/auth', require('./routes/auth'));      // /auth/register, /auth/login
app.use('/', require('./routes/users'));         // /profile, /admin/users
app.use('/tickets', require('./routes/tickets')); // CRUD билетов и вложенные вопросы

// Общий обработчик непредвиденных ошибок
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;

// Сначала подключаемся к MongoDB, потом запускаем сервер
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });
});
