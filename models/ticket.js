'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
      // Описание связей
    }
  }
  Ticket.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    questionsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 20
    },
    timeLimitMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 20
    },
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Ticket',
    tableName: 'Tickets'
  });
  return Ticket;
};