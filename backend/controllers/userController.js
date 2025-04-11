const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const sendEmail = require('../utils/email');

// Generate JWT token
// Update the signToken function
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '90d'
  });
};

// Update the getLockedUsers function
exports.getLockedUsers = async (req, res) => {
  try {
    console.log('Fetching locked users...');
    
    const lockedUsers = await User.findAll({
      where: { isLocked: true },
      attributes: { exclude: ['password'] }
    });
    
    console.log(`Found ${lockedUsers.length} locked users`);
    
    // Afficher les IDs des utilisateurs verrouillés pour le débogage
    if (lockedUsers.length > 0) {
      console.log('Locked user IDs:', lockedUsers.map(user => user.id));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        users: lockedUsers
      }
    });
  } catch (error) {
    console.error('Error fetching locked users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des utilisateurs bloqués'
    });
  }
};

// Update the unlockUser function
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
      message: 'Utilisateur débloqué avec succès'
    });
  } catch (error) {
    console.error('Error unlocking user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du déblocage de l\'utilisateur'
    });
  }
};

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    // Vérifier que le rôle n'est pas administrateur
    if (req.body.role === 'administrateur') {
      return res.status(403).json({
        status: 'error',
        message: 'Vous ne pouvez pas vous inscrire en tant qu\'administrateur'
      });
    }

    // Création de l'utilisateur avec les données fournies
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
      role: req.body.role // Le rôle est déjà vérifié ci-dessus
    });

    // Génération du token JWT
    const token = signToken(newUser.id);

    // Envoi de la réponse
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Mise à jour de la fonction getProfile
exports.getProfile = async (req, res) => {
  try {
    // req.user est déjà défini par le middleware protect
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
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
    console.error('Error fetching profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// Mise à jour de la fonction loginUser
// Update the loginUser function to include remaining attempts in the response
exports.loginUser = async (req, res) => {
  try {
    console.log('Login attempt received for:', req.body.email);
    
    const { email, password, recaptchaToken } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        status: 'error',
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Vérifier si l'utilisateur est verrouillé
    if (user.loginAttempts >= 5) {
      // Mettre à jour le statut isLocked à true
      if (!user.isLocked) {
        await user.update({ isLocked: true });
        console.log('User account locked and isLocked set to true:', email);
      }
      
      console.log('User account locked:', email);
      return res.status(401).json({
        status: 'error',
        message: 'Votre compte est verrouillé. Veuillez contacter un administrateur.'
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordCorrect = await user.correctPassword(password);
    
    if (!isPasswordCorrect) {
      // Incrémenter le nombre de tentatives de connexion
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      await user.save();
      
      console.log('Incorrect password for user:', email, 'Attempts:', user.loginAttempts);
      
      return res.status(401).json({
        status: 'error',
        message: 'Email ou mot de passe incorrect',
        remainingAttempts: 5 - user.loginAttempts
      });
    }
    
    // Réinitialiser le nombre de tentatives de connexion
    user.loginAttempts = 0;
    await user.save();
    
    // Créer un token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });
    
    // Masquer le mot de passe dans la réponse
    user.password = undefined;
    
    console.log('User logged in successfully:', email);
    
    // Envoyer la réponse avec un format cohérent
    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          // Autres propriétés utilisateur nécessaires
          phone: user.phone,
          address: user.address
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Une erreur est survenue lors de la connexion'
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
    const users = await User.findAll();
    
    // Filtrer les informations sensibles pour les non-administrateurs
    let filteredUsers;
    if (req.user.role === 'administrateur') {
      // Les administrateurs voient toutes les informations
      filteredUsers = users;
    } else {
      // Les autres utilisateurs ne voient que les informations de base
      filteredUsers = users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        users: filteredUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
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
// Update user profile
exports.updateMe = async (req, res) => {
  try {
    // Récupérer l'utilisateur avant la mise à jour
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier si le mot de passe est fourni
    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({
          status: 'error',
          message: 'Le mot de passe doit contenir au moins 8 caractères'
        });
      }
      console.log('Password update requested in updateMe');
    }
    
    // Mettre à jour l'utilisateur directement sur l'instance
    // Le hook beforeUpdate s'occupera de hacher le mot de passe
    await user.update(req.body);
    
    // Récupérer l'utilisateur mis à jour (sans le mot de passe)
    const updatedUser = await User.findByPk(req.user.id, {
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
      status: 'error',
      message: error.message
    });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    // Récupérer l'utilisateur avant la mise à jour
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier si le mot de passe est fourni
    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({
          status: 'error',
          message: 'Le mot de passe doit contenir au moins 8 caractères'
        });
      }
      console.log('Password update requested in updateUser for user ID:', req.params.id);
    }
    
    // Mettre à jour l'utilisateur directement sur l'instance
    // Le hook beforeUpdate s'occupera de hacher le mot de passe
    await user.update(req.body);
    
    // Récupérer l'utilisateur mis à jour (sans le mot de passe)
    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({
      status: 'error',
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

// Fonction pour mot de passe oublié
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Aucun utilisateur trouvé avec cet email'
      });
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before saving it to the database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token and expiration (10 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Create reset URL
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content with improved design
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de votre mot de passe</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #eee;
          }
          .logo {
            max-width: 200px;
            height: auto;
          }
          .content {
            padding: 20px 0;
          }
          h1 {
            color: #800000;
            margin-top: 0;
          }
          p {
            margin-bottom: 15px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #800000;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 15px 0;
          }
          .button:hover {
            background-color: #8B0000;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://planning-corporate.fr/logo-noir.png" alt="Planning-Corporate" class="logo">
          </div>
          <div class="content">
            <h1>Réinitialisation de votre mot de passe</h1>
            <p>Bonjour,</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Planning-Corporate. Veuillez cliquer sur le bouton ci-dessous pour définir un nouveau mot de passe.</p>
            <p style="text-align: center;">
              <a href="${resetURL}" class="button">Réinitialiser mon mot de passe</a>
            </p>
            <p>Ce lien est valable pendant 10 minutes. Après cette période, vous devrez faire une nouvelle demande de réinitialisation.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email ou contacter notre support si vous avez des questions.</p>
            <p>Cordialement,<br>L'équipe Planning-Corporate</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Comédie des Suds - Planning-Corporate. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de votre mot de passe (valable 10 minutes)',
      html
    });

    res.status(200).json({
      status: 'success',
      message: 'Un email de réinitialisation a été envoyé à votre adresse'
    });
  } catch (error) {
    console.error('Erreur d\'envoi d\'email:', error);
    
    // If there was a user with token already set, reset it
    if (req.body.email) {
      const user = await User.findOne({ where: { email: req.body.email } });
      if (user) {
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
      }
    }

    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.'
    });
  }
};

// Fonction pour réinitialiser le mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Veuillez fournir un token et un mot de passe'
      });
    }
    
    // Trouver l'utilisateur avec le token valide
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Token invalide ou expiré'
      });
    }
    
    // Valider le nouveau mot de passe
    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }
    
    // Mettre à jour le mot de passe
    user.password = password; // Le hook beforeSave s'occupera du hachage
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Votre mot de passe a été réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
};

// Ajouter cette nouvelle fonction au fichier userController.js

// Vérifier le mot de passe de l'utilisateur
exports.verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    // Récupérer l'utilisateur actuel
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordCorrect = await user.correctPassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        success: false,
        message: 'Mot de passe incorrect'
      });
    }
    
    res.status(200).json({
      status: 'success',
      success: true,
      message: 'Mot de passe correct'
    });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification du mot de passe'
    });
  }
};

// Ajouter cette nouvelle fonction pour vérifier le mot de passe
exports.verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Veuillez fournir un mot de passe'
      });
    }
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé'
      });
    }
    
    const isPasswordCorrect = await user.correctPassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'fail',
        success: false,
        message: 'Mot de passe incorrect'
      });
    }
    
    res.status(200).json({
      status: 'success',
      success: true,
      message: 'Mot de passe correct'
    });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification du mot de passe'
    });
  }
};