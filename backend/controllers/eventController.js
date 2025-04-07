const Event = require('../models/eventModel');
const Room = require('../models/roomModel');
const User = require('../models/userModel');
const { Op } = require('sequelize');

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
    
    // Add date filter for checking daily show limits
    if (req.query.date) {
      const date = new Date(req.query.date);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.where.start = {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      };
    }

    // Execute query
    const events = await Event.findAll(query);
    
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
  console.log(`Room ${roomId} has ${showCount} shows on ${date.toDateString()}`);
  return showCount >= 5;
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    // Extract assignedUsers from request body
    const { assignedUsers, ...eventData } = req.body;
    
    console.log('Creating event:', eventData.type, 'in room', eventData.roomId);
    
    // Check if this is a show and if we've reached the daily limit
    if (eventData.type === 'show') {
      const startDate = new Date(eventData.start);
      console.log('Checking show limit for date:', startDate);
      const hasReachedLimit = await checkShowLimit(eventData.roomId, startDate);
      
      console.log('Has reached limit:', hasReachedLimit);
      
      if (hasReachedLimit) {
        console.log('Limit reached, returning error');
        return res.status(400).json({
          status: 'error',
          message: 'Limite de 5 spectacles par jour atteinte pour cette salle'
        });
      }
    }
    
    // Check for overlapping events in the same room
    const overlappingEvents = await Event.findAll({
      where: {
        roomId: eventData.roomId,
        [Op.or]: [
          {
            // Event starts during another event
            start: {
              [Op.lt]: eventData.end,
              [Op.gte]: eventData.start
            }
          },
          {
            // Event ends during another event
            end: {
              [Op.gt]: eventData.start,
              [Op.lte]: eventData.end
            }
          },
          {
            // Event completely contains another event
            start: {
              [Op.lte]: eventData.start
            },
            end: {
              [Op.gte]: eventData.end
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
    const conflictingEvents = overlappingEvents.filter(event => !canEventsOverlap(eventData.type, event.type));
    
    if (conflictingEvents.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Conflit d'horaire avec l'événement "${conflictingEvents[0].title}" dans la salle ${conflictingEvents[0].Room.name}`
      });
    }
    
    // Create the event
    const event = await Event.create({
      ...eventData,
      creatorId: req.user.id
    });
    
    // If assignedUsers is provided, associate users with the event
    if (assignedUsers && assignedUsers.length > 0) {
      await event.setUsers(assignedUsers);
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
    console.error('Error creating event:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    // Extract assignedUsers from request body
    const { assignedUsers, ...eventData } = req.body;
    
    // Find the event
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }
    
    // Check if user has permission to update
    if (req.user.role !== 'administrateur' && event.creatorId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à modifier cet événement'
      });
    }
    
    // Check if this is a show and if we've reached the daily limit
    // Only check if the type is changing to 'show' or if the date or room is changing for an existing show
    const newType = eventData.type || event.type;
    const newRoomId = eventData.roomId || event.roomId;
    const newStart = eventData.start ? new Date(eventData.start) : new Date(event.start);
    
    if (newType === 'show' && (
        eventData.type !== undefined || 
        eventData.start !== undefined || 
        eventData.roomId !== undefined
      )) {
      const hasReachedLimit = await checkShowLimit(newRoomId, newStart, event.id);
      
      if (hasReachedLimit) {
        return res.status(400).json({
          status: 'error',
          message: 'Limite de 5 spectacles par jour atteinte pour cette salle'
        });
      }
    }
    
    // Check for overlapping events if room or time is changing
    if (eventData.roomId || eventData.start || eventData.end) {
      const roomId = eventData.roomId || event.roomId;
      const start = eventData.start ? new Date(eventData.start) : event.start;
      const end = eventData.end ? new Date(eventData.end) : event.end;
      
      // Find overlapping events in the same room
      const overlappingEvents = await Event.findAll({
        where: {
          roomId: roomId,
          id: { [Op.ne]: event.id }, // Exclude the current event being updated
          [Op.or]: [
            {
              start: { [Op.lt]: end },
              end: { [Op.gt]: start }
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
      
      // Check if any of the overlapping events can't overlap with this event type
      const eventType = eventData.type || event.type;
      const conflictingEvents = overlappingEvents.filter(e => !canEventsOverlap(eventType, e.type));
      
      if (conflictingEvents.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Conflit d'horaire avec l'événement "${conflictingEvents[0].title}" dans la salle ${conflictingEvents[0].Room.name}`
        });
      }
    }
    
    // Update event data
    await event.update(eventData);
    
    // If assignedUsers is provided, update user associations
    if (assignedUsers !== undefined) {
      await event.setUsers(assignedUsers);
    }
    
    // Fetch the updated event with associations
    const updatedEvent = await Event.findByPk(event.id, {
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
    console.error('Error updating event:', error);
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
    
    // Check if the user has permission to delete this event
    if (req.user.role !== 'administrateur' && event.creatorId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à supprimer cet événement'
      });
    }
    
    await event.destroy();
    
    res.status(200).json({
      status: 'success',
      message: 'Événement supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add users to an event
exports.addUsersToEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        status: 'error',
        message: 'Veuillez fournir un tableau d\'identifiants d\'utilisateurs'
      });
    }
    
    const event = await Event.findByPk(eventId);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
    }
    
    // Check if the user has permission to update this event
    if (req.user.role !== 'administrateur' && event.creatorId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à modifier cet événement'
      });
    }
    
    // Get current users
    const currentUsers = await event.getUsers();
    const currentUserIds = currentUsers.map(user => user.id);
    
    // Add new users (avoid duplicates)
    const newUserIds = userIds.filter(id => !currentUserIds.includes(id));
    
    if (newUserIds.length > 0) {
      await event.addUsers(newUserIds);
    }
    
    // Fetch the updated event with associations
    const updatedEvent = await Event.findByPk(eventId, {
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
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Remove users from an event
exports.removeUsersFromEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        status: 'error',
        message: 'Veuillez fournir un tableau d\'identifiants d\'utilisateurs'
      });
    }
    
    const event = await Event.findByPk(eventId);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
    }
    
    // Check if the user has permission to update this event
    if (req.user.role !== 'administrateur' && event.creatorId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à modifier cet événement'
      });
    }
    
    // Remove users
    await event.removeUsers(userIds);
    
    // Fetch the updated event with associations
    const updatedEvent = await Event.findByPk(eventId, {
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
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

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

// Ajout d'une nouvelle route pour récupérer les utilisateurs par rôle
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!role) {
      return res.status(400).json({
        status: 'error',
        message: 'Le rôle est requis'
      });
    }
    
    const users = await User.findAll({
      where: { role },
      attributes: ['id', 'firstName', 'lastName', 'role']
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        users
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};