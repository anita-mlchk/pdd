const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Не задана переменная окружения MONGO_URI (проверьте файл .env)');
  }
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected:', mongoose.connection.name);
}

module.exports = connectDB;