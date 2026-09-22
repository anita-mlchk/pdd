'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Tickets', [
      {
        title: 'Билет №1 (Категория B)',
        category: 'B',
        questionsCount: 10,
        timeLimitMinutes: 15,
        description: 'Основы ПДД, проезд перекрестков, дорожная разметка',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Билет №2 (Категория B)',
        category: 'B',
        questionsCount: 10,
        timeLimitMinutes: 15,
        description: 'Знаки приоритета, обгон и маневрирование',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Билет №3 (Категория C)',
        category: 'C',
        questionsCount: 10,
        timeLimitMinutes: 20,
        description: 'Специфика управления грузовым транспортом',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Tickets', null, {});
  }
};