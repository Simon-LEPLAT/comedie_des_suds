const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventPdf = sequelize.define('EventPdf', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = EventPdf;