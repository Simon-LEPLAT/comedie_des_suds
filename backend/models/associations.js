const Event = require('./eventModel');
const Room = require('./roomModel');
const User = require('./userModel');
const EventPdf = require('./eventPdfModel');

// Event associations
Event.belongsTo(Room, { foreignKey: 'roomId' });
Room.hasMany(Event, { foreignKey: 'roomId' });

// User associations with Event (creator)
Event.belongsTo(User, { as: 'Creator', foreignKey: 'creatorId' });
User.hasMany(Event, { as: 'CreatedEvents', foreignKey: 'creatorId' });

// Many-to-Many relationship between Event and User (assigned users)
Event.belongsToMany(User, { through: 'EventUsers', as: 'Users' });
User.belongsToMany(Event, { through: 'EventUsers', as: 'AssignedEvents' });

// One-to-Many relationship between Event and EventPdf
Event.hasMany(EventPdf, { foreignKey: 'eventId' });
EventPdf.belongsTo(Event, { foreignKey: 'eventId' });

module.exports = {
  Event,
  Room,
  User,
  EventPdf
};