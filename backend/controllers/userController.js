const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Generate JWT token
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '90d' // Changed from 30d to 90d for longer session
  });
};

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      address: req.body.address,
      birthDate: req.body.birthDate,
      birthPlace: req.body.birthPlace,
      socialSecurityNumber: req.body.socialSecurityNumber,
      showLeaveNumber: req.body.showLeaveNumber,
      phone: req.body.phone,
      iban: req.body.iban,
      role: req.body.role || 'artiste'
    });
    
    const token = signToken(newUser.id);
    
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          address: newUser.address,
          birthDate: newUser.birthDate,
          birthPlace: newUser.birthPlace,
          socialSecurityNumber: newUser.socialSecurityNumber,
          showLeaveNumber: newUser.showLeaveNumber,
          phone: newUser.phone,
          iban: newUser.iban
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message || 'Erreur lors de l\'inscription'
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Veuillez fournir un email et un mot de passe'
      });
    }
    
    const user = await User.findOne({ where: { email: email } });
    
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({
        status: 'fail',
        message: 'Compte bloqué. Veuillez contacter un administrateur.'
      });
    }

    const isPasswordValid = await user.correctPassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.update({
        loginAttempts: user.loginAttempts + 1,
        lastLoginAttempt: new Date()
      });

      // Lock account if 3 failed attempts
      if (user.loginAttempts >= 3) {
        await user.update({ isLocked: true });
        return res.status(401).json({
          status: 'fail',
          message: 'Compte bloqué après 3 tentatives échouées. Contactez un administrateur.'
        });
      }

      return res.status(401).json({
        status: 'fail',
        message: `Email ou mot de passe incorrect. ${3 - user.loginAttempts} tentatives restantes.`
      });
    }

    // Reset login attempts on successful login
    await user.update({
      loginAttempts: 0,
      lastLoginAttempt: null
    });
    
    const token = signToken(user.id);
    
    res.status(200).json({
      status: 'success',
      token,
      data: { user }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      status: 'fail',
      message: 'Une erreur est survenue lors de la connexion'
    });
  }
};

// Add new controller for unlocking accounts
exports.getLockedUsers = async (req, res) => {
  try {
    const lockedUsers = await User.findAll({
      where: { isLocked: true },
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({
      status: 'success',
      data: { users: lockedUsers }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.unlockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé'
      });
    }

    await user.update({
      isLocked: false,
      loginAttempts: 0,
      lastLoginAttempt: null
    });

    res.status(200).json({
      status: 'success',
      message: 'Compte débloqué avec succès'
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé'
      });
    }

    // Create update object
    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      address: req.body.address,
      birthDate: req.body.birthDate,
      birthPlace: req.body.birthPlace,
      socialSecurityNumber: req.body.socialSecurityNumber,
      showLeaveNumber: req.body.showLeaveNumber,
      phone: req.body.phone,
      iban: req.body.iban
    };

    // Only allow role update if user is administrator
    if (req.body.role && user.role === 'administrateur') {
      updateData.role = req.body.role;
    }

    // Update user
    await user.update(updateData);

    // Get updated user data
    const updatedUser = await User.findByPk(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          address: updatedUser.address,
          birthDate: updatedUser.birthDate,
          birthPlace: updatedUser.birthPlace,
          socialSecurityNumber: updatedUser.socialSecurityNumber,
          showLeaveNumber: updatedUser.showLeaveNumber,
          phone: updatedUser.phone,
          iban: updatedUser.iban,
          role: updatedUser.role
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message || 'Erreur lors de la mise à jour du profil'
    });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] } // Exclude password from the response
    });
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] } // Exclude password from the response
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé'
      });
    }

    // Create update object
    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      address: req.body.address,
      birthDate: req.body.birthDate,
      birthPlace: req.body.birthPlace,
      socialSecurityNumber: req.body.socialSecurityNumber,
      showLeaveNumber: req.body.showLeaveNumber,
      phone: req.body.phone,
      iban: req.body.iban,
      role: req.body.role
    };

    await user.update(updateData);

    // Get updated user data
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé'
      });
    }

    await user.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};