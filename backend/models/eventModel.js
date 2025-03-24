const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Room = require('./roomModel');
const User = require('./userModel');

const Event = sequelize.define('Event', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le titre est requis' }
    }
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
    type: DataTypes.ENUM('show', 'permanence', 'ticketing', 'technical', 'rental', 'event'),
    defaultValue: 'show'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#4CAF50'
  }
});

// Relationships
Event.belongsTo(Room, { foreignKey: 'roomId' });
Room.hasMany(Event, { foreignKey: 'roomId' });

// Many-to-many relationship with users (for assigned users)
Event.belongsToMany(User, { through: 'EventUsers' });
User.belongsToMany(Event, { through: 'EventUsers' });

module.exports = Event;