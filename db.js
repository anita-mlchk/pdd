const mongoose = require('mongoose');

// Подключение к MongoDB (строка подключения берется из .env)
async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error('Ошибка: не задан MONGO_URI. Проверьте файл .env в корне проекта.');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
