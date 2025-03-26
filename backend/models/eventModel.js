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
    type: DataTypes.ENUM('show', 'permanence', 'ticketing', 'technical', 'rental', 'event', 'calage'),
    defaultValue: 'show'
  },
  // Add show status field
  showStatus: {
    type: DataTypes.ENUM('provisional', 'confirmed', 'ticketsOpen'),
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
  }
});

// Relationships
Event.belongsTo(Room, { foreignKey: 'roomId' });
Room.hasMany(Event, { foreignKey: 'roomId' });

// Many-to-many relationship with User (for assigned users)
Event.belongsToMany(User, { through: 'EventUsers' });
User.belongsToMany(Event, { through: 'EventUsers' });

// Creator relationship (one-to-many)
Event.belongsTo(User, { as: 'Creator', foreignKey: 'creatorId' });
User.hasMany(Event, { as: 'CreatedEvents', foreignKey: 'creatorId' });

// Add this association to your Event model
const EventPdf = require('./eventPdfModel');

// After defining the Event model, add:
Event.hasMany(EventPdf, { foreignKey: 'eventId', as: 'pdfs' });
EventPdf.belongsTo(Event, { foreignKey: 'eventId' });
module.exports = Event;