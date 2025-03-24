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
        status: 'fail',
        message: 'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ 
        status: 'fail',
        message: 'L\'utilisateur associé à ce token n\'existe plus.' 
      });
    }
    
    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      status: 'fail',
      message: 'Session expirée ou token invalide. Veuillez vous reconnecter.' 
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