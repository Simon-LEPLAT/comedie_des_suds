const express = require('express');
const roomController = require('../controllers/roomController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, roomController.getAllRooms)
  .post(protect, restrictTo('administrateur'), roomController.createRoom);

router
  .route('/:id')
  .get(protect, roomController.getRoom)
  .patch(protect, restrictTo('administrateur'), roomController.updateRoom)
  .delete(protect, restrictTo('administrateur'), roomController.deleteRoom);

module.exports = router;