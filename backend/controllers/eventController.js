const Event = require('../models/eventModel');
const Room = require('../models/roomModel');
const User = require('../models/userModel');
const { Op } = require('sequelize'); // Add this import

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [
        {
          model: Room,
          attributes: ['id', 'name']
        },
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'role']
        }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        events
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, start, end, roomId, type, description, color } = req.body;
    
    // Check for conflicts
    const conflictingEvents = await Event.findAll({
      where: {
        roomId,
        [Op.or]: [ // Use Op instead of sequelize.Op
          {
            start: {
              [Op.lt]: end // Use Op instead of sequelize.Op
            },
            end: {
              [Op.gt]: start // Use Op instead of sequelize.Op
            }
          }
        ]
      }
    });
    
    if (conflictingEvents.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Il y a déjà un événement prévu dans cette salle à cette période'
      });
    }
    
    const event = await Event.create({
      title,
      start,
      end,
      roomId,
      type,
      description,
      color
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        event
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get a single event
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        {
          model: Room,
          attributes: ['id', 'name']
        },
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'role']
        }
      ]
    });
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        event
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
    }
    
    const { title, start, end, roomId, type, description, color } = req.body;
    
    // Check for conflicts (excluding this event)
    if (start && end && roomId) {
      const conflictingEvents = await Event.findAll({
        where: {
          id: {
            [Op.ne]: req.params.id // Use Op instead of sequelize.Op
          },
          roomId,
          [Op.or]: [ // Use Op instead of sequelize.Op
            {
              start: {
                [Op.lt]: end // Use Op instead of sequelize.Op
              },
              end: {
                [Op.gt]: start // Use Op instead of sequelize.Op
              }
            }
          ]
        }
      });
      
      if (conflictingEvents.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Il y a déjà un événement prévu dans cette salle à cette période'
        });
      }
    }
    
    await event.update({
      title,
      start,
      end,
      roomId,
      type,
      description,
      color
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        event
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
    }
    
    await event.destroy();
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};