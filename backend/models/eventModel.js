const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Room = require('./roomModel');
const User = require('./userModel');

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
    type: DataTypes.ENUM('show', 'permanence', 'ticketing', 'régie', 'rental', 'calage', 'event'),
    defaultValue: 'show'
  },
  // Add show status field
  showStatus: {
    type: DataTypes.ENUM('provisional', 'confirmed', 'ticketsOpen', 'cancelled'),
    defaultValue: 'provisional',
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#4CAF50'
  },
  // Ajout du champ pour la co-réalisation
  coRealizationPercentage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  }
});

// Define associations
Event.belongsTo(Room, { foreignKey: 'roomId' });
Event.belongsTo(User, { foreignKey: 'creatorId', as: 'Creator' });

// Add Many-to-Many relationship with User
Event.belongsToMany(User, { 
  through: 'EventUsers',
  as: 'Users'
});

// Fix the alias here - change 'Events' to 'AssignedEvents'
User.belongsToMany(Event, { 
  through: 'EventUsers',
  as: 'AssignedEvents'  // Changed from 'Events' to 'AssignedEvents'
});

module.exports = Event;