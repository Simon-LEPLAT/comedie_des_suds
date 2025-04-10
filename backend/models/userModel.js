const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Veuillez entrer votre prénom' }
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Veuillez entrer votre nom' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    // Remove the unique: true line
    validate: {
      isEmail: { msg: 'Veuillez entrer un email valide' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [8],
        msg: 'Le mot de passe doit contenir au moins 8 caractères'
      }
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Veuillez entrer votre adresse' }
    }
  },
  birthDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  birthPlace: {
    type: DataTypes.STRING,
    allowNull: false
  },
  socialSecurityNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  showLeaveNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  iban: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('administrateur', 'artiste', 'permanence', 'billeterie', 'regie'),
    defaultValue: 'artiste'
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLoginAttempt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Ajouter ces champs pour la réinitialisation du mot de passe
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.correctPassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      console.error('No password found for user');
      return false;
    }
    console.log('Comparing password:', candidatePassword.substring(0, 3) + '***');
    console.log('With hashed password:', this.password.substring(0, 10) + '...');
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

module.exports = User;