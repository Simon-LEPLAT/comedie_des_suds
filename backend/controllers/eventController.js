const Event = require('../models/eventModel');
const Room = require('../models/roomModel');
const User = require('../models/userModel');
const { Op } = require('sequelize'); // Add this import

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    // Build query based on user role and filters
    const query = {
      include: [
        {
          model: Room,
          attributes: ['id', 'name', 'capacity']
        },
        {
          model: User,
          as: 'Users',
          attributes: ['id', 'firstName', 'lastName', 'role']
        },
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'firstName', 'lastName', 'role']
        }
      ],
      where: {} // Initialize empty where clause
    };

    // Apply filters if provided
    if (req.query.roomId) {
      query.where.roomId = req.query.roomId;
    }

    if (req.query.type) {
      query.where.type = req.query.type;
    }

    if (req.query.creatorId) {
      query.where.creatorId = req.query.creatorId;
    }

    // If user is not an administrator, only show events they're assigned to
    if (req.user.role !== 'administrateur') {
      query.include[1].where = { id: req.user.id };
    }

    const events = await Event.findAll(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        events
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Helper function to check if events can overlap
const canEventsOverlap = (eventType1, eventType2) => {
  // These event types can overlap with anything
  const canOverlapWithAnything = ['permanence', 'ticketing', 'régie'];
  
  // If either event is one that can overlap with anything, allow it
  if (canOverlapWithAnything.includes(eventType1) || canOverlapWithAnything.includes(eventType2)) {
    return true;
  }
  
  // All other event types can only overlap with permanence, ticketing, and régie
  // So if we reach here and neither event is in the canOverlapWithAnything list, they can't overlap
  return false;
};

// Helper function to check if there are already 5 shows in a room on a given day
const checkShowLimit = async (roomId, date, eventId = null) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const query = {
    where: {
      roomId,
      type: 'show',
      start: {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      }
    }
  };
  
  // If updating an event, exclude the current event from the count
  if (eventId) {
    query.where.id = { [Op.ne]: eventId };
  }
  
  const showCount = await Event.count(query);
  return showCount >= 5;
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, start, end, roomId, type, description, color, showStatus, userIds } = req.body;
    
    // Validate required fields
    if (!title || !start || !end || !roomId) {
      return res.status(400).json({
        status: 'error',
        message: 'Veuillez fournir tous les champs requis'
      });
    }
    
    // Check show limit if the event type is 'show'
    if (type === 'show') {
      const startDate = new Date(start);
      const tooManyShows = await checkShowLimit(roomId, startDate);
      
      if (tooManyShows) {
        return res.status(400).json({
          status: 'error',
          message: 'Limite de 5 spectacles par jour atteinte pour cette salle'
        });
      }
    }
    
    // Check for overlapping events in the same room
    const overlappingEvents = await Event.findAll({
      where: {
        roomId,
        [Op.or]: [
          {
            // Event starts during another event
            start: {
              [Op.lt]: end,
              [Op.gte]: start
            }
          },
          {
            // Event ends during another event
            end: {
              [Op.gt]: start,
              [Op.lte]: end
            }
          },
          {
            // Event completely contains another event
            start: {
              [Op.lte]: start
            },
            end: {
              [Op.gte]: end
            }
          }
        ]
      },
      include: [
        {
          model: Room,
          attributes: ['id', 'name']
        }
      ]
    });
    
    // Check if any of the overlapping events can't overlap with the new event
    const conflictingEvents = overlappingEvents.filter(event => !canEventsOverlap(type, event.type));
    
    if (conflictingEvents.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Conflit d'horaire avec l'événement "${conflictingEvents[0].title}" dans la salle ${conflictingEvents[0].Room.name}`
      });
    }
    
    // Create the event
    const event = await Event.create({
      title,
      start,
      end,
      roomId,
      type,
      description,
      color,
      showStatus,
      creatorId: req.user.id // Set the creator ID to the current user
    });
    
    // If userIds are provided, associate users with the event
    if (userIds && userIds.length > 0) {
      await event.setUsers(userIds);
    } else {
      // If no users specified, assign the creator
      await event.setUsers([req.user.id]);
    }
    
    // Fetch the created event with associations
    const createdEvent = await Event.findByPk(event.id, {
      include: [
        {
          model: Room,
          attributes: ['id', 'name', 'capacity']
        },
        {
          model: User,
          as: 'Users',
          attributes: ['id', 'firstName', 'lastName', 'role']
        },
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'firstName', 'lastName', 'role']
        }
      ]
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        event: createdEvent
      }
    });
  } catch (error) {
    res.status(200).json({
      status: 'success',
      data: {
        event: updatedEvent
      }
    });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start, end, roomId, type, description, color, showStatus, userIds } = req.body;
    
    // Find the event
    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
    }
    
    // Check if user has permission to update
    if (req.user.role !== 'administrateur' && event.creatorId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à modifier cet événement'
      });
    }
    
    // Check show limit if changing to show type or changing date/room of a show
    const newType = type || event.type;
    const newRoomId = roomId || event.roomId;
    const newStart = start ? new Date(start) : new Date(event.start);
    
    if (newType === 'show' && (
        type !== event.type || 
        start !== event.start || 
        roomId !== event.roomId
      )) {
      const tooManyShows = await checkShowLimit(newRoomId, newStart, id);
      
      if (tooManyShows) {
        return res.status(400).json({
          status: 'error',
          message: 'Limite de 5 spectacles par jour atteinte pour cette salle'
        });
      }
    }
    
    // If changing time or room, check for overlapping events
    if ((start && start !== event.start) || 
        (end && end !== event.end) || 
        (roomId && roomId !== event.roomId)) {
      
      const newStart = start || event.start;
      const newEnd = end || event.end;
      const newRoomId = roomId || event.roomId;
      const newType = type || event.type;
      
      const overlappingEvents = await Event.findAll({
        where: {
          id: { [Op.ne]: id }, // Exclude the current event
          roomId: newRoomId,
          [Op.or]: [
            {
              // Event starts during another event
              start: {
                [Op.lt]: newEnd,
                [Op.gte]: newStart
              }
            },
            {
              // Event ends during another event
              end: {
                [Op.gt]: newStart,
                [Op.lte]: newEnd
              }
            },
            {
              // Event completely contains another event
              start: {
                [Op.lte]: newStart
              },
              end: {
                [Op.gte]: newEnd
              }
            }
          ]
        },
        include: [
          {
            model: Room,
            attributes: ['id', 'name']
          }
        ]
      });
      
      // Check if any of the overlapping events can't overlap with the updated event
      const conflictingEvents = overlappingEvents.filter(e => !canEventsOverlap(newType, e.type));
      
      if (conflictingEvents.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Conflit d'horaire avec l'événement "${conflictingEvents[0].title}" dans la salle ${conflictingEvents[0].Room.name}`
        });
      }
    }
    
    // Update the event
    await event.update({
      title: title || event.title,
      start: start || event.start,
      end: end || event.end,
      roomId: roomId || event.roomId,
      type: type || event.type,
      description: description !== undefined ? description : event.description,
      color: color || event.color,
      showStatus: showStatus || event.showStatus
    });
    
    // Update associated users if provided
    if (userIds && userIds.length > 0) {
      await event.setUsers(userIds);
    }
    
    // Fetch the updated event with associations
    const updatedEvent = await Event.findByPk(id, {
      include: [
        {
          model: Room,
          attributes: ['id', 'name', 'capacity']
        },
        {
          model: User,
          as: 'Users',
          attributes: ['id', 'firstName', 'lastName', 'role']
        },
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'firstName', 'lastName', 'role']
        }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        event: updatedEvent
      }
    });
  } catch (error) {
    res.status(500).json({
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
    const event = await Event.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['id']
        }
      ]
    });
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
    }
    
    // Check if user is authorized to update this event
    const userIds = event.Users.map(user => user.id);
    if (req.user.role !== 'administrateur' && !userIds.includes(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à modifier cet événement'
      });
    }
    
    const { title, start, end, roomId, type, description, color } = req.body;
    
    // Check for conflicts (excluding this event)
    if (start && end && roomId) {
      const conflictingEvents = await Event.findAll({
        where: {
          id: {
            [Op.ne]: req.params.id
          },
          roomId,
          [Op.or]: [
            {
              start: {
                [Op.lt]: end
              },
              end: {
                [Op.gt]: start
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
    const event = await Event.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['id']
        }
      ]
    });
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
    }
    
    // Check if user is authorized to delete this event
    const userIds = event.Users.map(user => user.id);
    if (req.user.role !== 'administrateur' && !userIds.includes(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à supprimer cet événement'
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

// Add these functions to your eventController.js

// Validate theater play (max 5 per day per room)
exports.validateTheaterPlay = async (req, res) => {
  try {
    const { date, roomId } = req.query;
    
    if (!date || !roomId) {
      return res.status(400).json({
        status: 'error',
        message: 'Date et ID de salle requis'
      });
    }
    
    // Count plays for this date and room
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const count = await Event.count({
      where: {
        type: 'play',
        roomId: roomId,
        start: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });
    
    const valid = count < 5;
    
    res.status(200).json({
      status: 'success',
      valid,
      count
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Upload PDFs for an event
exports.uploadPdfs = async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findByPk(eventId);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
    }
    
    // Handle file uploads (using multer middleware)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Aucun fichier téléchargé'
      });
    }
    
    // Save PDF information to database
    const pdfPromises = req.files.map(file => {
      return EventPdf.create({
        eventId: eventId,
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        path: file.path
      });
    });
    
    await Promise.all(pdfPromises);
    
    res.status(200).json({
      status: 'success',
      message: 'Fichiers PDF ajoutés avec succès'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete a PDF
exports.deletePdf = async (req, res) => {
  try {
    const { eventId, pdfId } = req.params;
    
    const pdf = await EventPdf.findOne({
      where: {
        id: pdfId,
        eventId: eventId
      }
    });
    
    if (!pdf) {
      return res.status(404).json({
        status: 'error',
        message: 'PDF non trouvé'
      });
    }
    
    // Delete file from filesystem
    const fs = require('fs');
    if (fs.existsSync(pdf.path)) {
      fs.unlinkSync(pdf.path);
    }
    
    // Delete from database
    await pdf.destroy();
    
    res.status(200).json({
      status: 'success',
      message: 'Fichier PDF supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};