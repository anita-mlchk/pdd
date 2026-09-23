'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
    }
  }
  Ticket.init({
    title: DataTypes.STRING,
    category: DataTypes.STRING,
    questionsCount: DataTypes.INTEGER,
    timeLimitMinutes: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Ticket',
  });
  return Ticket;
};
