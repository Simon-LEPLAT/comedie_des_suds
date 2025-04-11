const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getProfile, 
  updateProfile, 
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getLockedUsers,
  unlockUser,
  verifyPassword,
  forgotPassword,
  resetPassword
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Routes existantes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, getAllUsers);
router.post('/unlock/:id', protect, restrictTo('administrateur'), unlockUser);
router.get('/locked', protect, restrictTo('administrateur'), getLockedUsers);
router.get('/:id', protect, restrictTo('administrateur'), getUserById);
router.put('/:id', protect, restrictTo('administrateur'), updateUser);
router.delete('/:id', protect, restrictTo('administrateur'), deleteUser);
router.post('/verify-password', protect, verifyPassword);

// Nouvelles routes pour la réinitialisation du mot de passe
router.post('/forgot-password', forgotPassword);
// Update the reset-password route to accept a token parameter
router.post('/reset-password/:token', resetPassword);

module.exports = router;
