const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Please log in to access this resource'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const currentUser = await User.findByPk(decoded.id);
      
      if (!currentUser) {
        return res.status(401).json({
          status: 'error',
          message: 'The user belonging to this token no longer exists'
        });
      }

      if (currentUser.isLocked) {
        return res.status(401).json({
          status: 'error',
          message: 'Your account has been locked'
        });
      }

      req.user = currentUser;
      next();
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token. Please log in again'
        });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Your token has expired. Please log in again'
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while authenticating'
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Vous n\'avez pas la permission d\'effectuer cette action' });
    }
    next();
  };
};