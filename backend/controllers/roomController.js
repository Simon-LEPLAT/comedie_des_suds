const Room = require('../models/roomModel');

// Get all rooms
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll();
    
    res.status(200).json({
      status: 'success',
      data: {
        rooms
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const { name, capacity, description } = req.body;
    
    const room = await Room.create({
      name,
      capacity,
      description
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        room
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get a single room
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Salle non trouvée'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        room
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update a room
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Salle non trouvée'
      });
    }
    
    const { name, capacity, description } = req.body;
    
    await room.update({
      name,
      capacity,
      description
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        room
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete a room
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Salle non trouvée'
      });
    }
    
    await room.destroy();
    
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