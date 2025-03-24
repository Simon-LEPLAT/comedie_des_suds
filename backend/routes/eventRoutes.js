const express = require('express');
const eventController = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, eventController.getAllEvents)
  .post(protect, eventController.createEvent);

router
  .route('/:id')
  .get(protect, eventController.getEvent)
  .patch(protect, eventController.updateEvent)
  .delete(protect, restrictTo('administrateur'), eventController.deleteEvent);

module.exports = router;