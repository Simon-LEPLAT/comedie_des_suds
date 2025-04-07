const express = require('express');
const eventController = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
    }
    cb(null, true);
  }
});

const router = express.Router();

// Existing routes
router
  .route('/')
  .get(protect, eventController.getAllEvents)
  .post(protect, eventController.createEvent);

router
  .route('/:id')
  .get(protect, eventController.getEvent)
  .patch(protect, eventController.updateEvent)
  .delete(protect, restrictTo('administrateur'), eventController.deleteEvent);

// New routes for theater play validation and PDF management
router.get('/validate-play', protect, eventController.validateTheaterPlay);

router.post('/upload-pdfs', protect, upload.array('pdfs', 10), eventController.uploadPdfs);

router.delete('/:eventId/pdfs/:pdfId', protect, eventController.deletePdf);

// Ajouter cette nouvelle route
router.get('/users-by-role/:role', protect, eventController.getUsersByRole);

module.exports = router;