const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end: {
    type: DataTypes.DATE,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('show', 'rehearsal', 'maintenance', 'other'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Rooms',
      key: 'id'
    }
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  showStatus: {
    type: DataTypes.ENUM('confirmed', 'provisional', 'cancelled'),
    allowNull: true,
    defaultValue: 'provisional'
  },
  coRealizationPercentage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  ticketingLocation: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''  // Définir une valeur par défaut vide au lieu de null
  },
  hasDecor: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  decorDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''  // Définir une valeur par défaut vide au lieu de null
  }
});

module.exports = Event;