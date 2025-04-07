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
    const { assignedUsers, ...eventData } = req.body;
    
    console.log('Received event data for creation:', eventData);
    
    // Forcer les valeurs pour les champs problématiques
    const eventToCreate = {
      ...eventData,
      ticketingLocation: eventData.ticketingLocation || '',
      hasDecor: Boolean(eventData.hasDecor),
      decorDetails: eventData.decorDetails || ''
    };
    
    console.log('Event data to be created:', eventToCreate);
    
    // Create the event
    const event = await Event.create({
      ...eventToCreate,
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
    
    console.log('Created event special fields:', {
      ticketingLocation: createdEvent.ticketingLocation,
      hasDecor: createdEvent.hasDecor,
      decorDetails: createdEvent.decorDetails
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
    const { assignedUsers, ...eventData } = req.body;
    
    console.log('Received event data for update:', eventData);
    
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
    
    // Create update object with proper handling of special fields
    const updateData = { ...eventData };
    
    // Forcer les valeurs pour les champs problématiques
    if (eventData.hasOwnProperty('ticketingLocation')) {
      // Si la valeur est null ou undefined, utiliser une chaîne vide
      updateData.ticketingLocation = eventData.ticketingLocation || '';
    }
    
    if (eventData.hasOwnProperty('hasDecor')) {
      // Convertir explicitement en booléen
      updateData.hasDecor = Boolean(eventData.hasDecor);
    }
    
    if (eventData.hasOwnProperty('decorDetails')) {
      // Si la valeur est null ou undefined, utiliser une chaîne vide
      updateData.decorDetails = eventData.decorDetails || '';
    }
    
    console.log('Update data to be sent:', updateData);
    
    // Mettre à jour l'événement avec les données préparées
    await event.update(updateData);
    
    // Vérification immédiate après la mise à jour
    const verifyUpdate = await Event.findByPk(event.id);
    console.log('Verification after update:', {
      ticketingLocation: verifyUpdate.ticketingLocation,
      hasDecor: verifyUpdate.hasDecor,
      decorDetails: verifyUpdate.decorDetails
    });
    
    // If assignedUsers is provided, update the event's users
    if (assignedUsers) {
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

    // Verify the update worked
    console.log('Final updated event:', {
      ticketingLocation: updatedEvent.ticketingLocation,
      hasDecor: updatedEvent.hasDecor,
      decorDetails: updatedEvent.decorDetails
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

// Upload PDF for an event
exports.uploadEventPdf = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findByPk(eventId);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
    }
    
    // Check if user has permission
    if (req.user.role !== 'administrateur' && event.creatorId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à modifier cet événement'
      });
    }
    
    // Check if event already has 10 PDFs
    const pdfCount = await EventPdf.count({ where: { eventId } });
    if (pdfCount >= 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Limite de 10 PDF par événement atteinte'
      });
    }
    
    // Create PDF record
    const pdfData = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      path: req.file.path,
      eventId
    };
    
    const pdf = await EventPdf.create(pdfData);
    
    res.status(201).json({
      status: 'success',
      data: {
        pdf
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all PDFs for an event
exports.getEventPdfs = async (req, res) => {
  try {
    const eventId = req.params.id;
    const pdfs = await EventPdf.findAll({ where: { eventId } });
    
    res.status(200).json({
      status: 'success',
      data: {
        pdfs
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete a PDF
exports.deleteEventPdf = async (req, res) => {
  try {
    const pdfId = req.params.pdfId;
    const pdf = await EventPdf.findByPk(pdfId);
    
    if (!pdf) {
      return res.status(404).json({
        status: 'error',
        message: 'PDF non trouvé'
      });
    }
    
    // Check if user has permission
    const event = await Event.findByPk(pdf.eventId);
    if (req.user.role !== 'administrateur' && event.creatorId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à supprimer ce PDF'
      });
    }
    
    // Delete the file from the server
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', pdf.path);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete the record
    await pdf.destroy();
    
    res.status(200).json({
      status: 'success',
      message: 'PDF supprimé avec succès'
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