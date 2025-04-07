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

// Event routes
router
  .route('/')
  .get(protect, eventController.getAllEvents)
  .post(protect, eventController.createEvent);

router
  .route('/:id')
  .get(protect, eventController.getEvent)
  .patch(protect, eventController.updateEvent)
  .delete(protect, eventController.deleteEvent);

// PDF routes
router
  .route('/:id/pdfs')
  .get(protect, eventController.getEventPdfs)
  .post(protect, upload.single('pdf'), eventController.uploadEventPdf);

router
  .route('/:id/pdfs/:pdfId')
  .delete(protect, eventController.deleteEventPdf);

module.exports = router;