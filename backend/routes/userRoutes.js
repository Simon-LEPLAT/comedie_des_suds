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
  getLockedUsers,    // Add this import
  unlockUser         // Add this import
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, restrictTo('administrateur'), getAllUsers);
// Move the locked routes before the :id route to prevent path conflicts
router.get('/locked', protect, restrictTo('administrateur'), getLockedUsers);
router.post('/unlock/:id', protect, restrictTo('administrateur'), unlockUser);

router.get('/:id', protect, restrictTo('administrateur'), getUserById);
router.put('/:id', protect, restrictTo('administrateur'), updateUser);
router.delete('/:id', protect, restrictTo('administrateur'), deleteUser);

module.exports = router;