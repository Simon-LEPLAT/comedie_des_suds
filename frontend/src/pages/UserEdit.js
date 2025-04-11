import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CheckIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const UserEdit = () => {
  // ===== HOOKS ET CONTEXTE =====
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useContext(AuthContext);
  
  // ===== ÉTATS =====
  // États du formulaire principal
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    birthDate: '',
    birthPlace: '',
    socialSecurityNumber: '',
    showLeaveNumber: '',
    phone: '',
    iban: '',
    role: ''
  });
  
  // États du formulaire de mot de passe
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  // États des messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États d'affichage
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  // États pour la confirmation par mot de passe
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // États pour la validation
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: '',
    socialSecurityNumber: ''
  });

  // ===== EFFETS =====
  // Chargement des données de l'utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        const userData = response.data.data.user;
        setFormData({
          ...userData,
          birthDate: userData.birthDate ? new Date(userData.birthDate).toISOString().split('T')[0] : ''
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des données');
      }
    };

    fetchUser();
  }, [id, api]);

  // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====
  // Gestion des changements dans le formulaire principal
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validation en temps réel
    validateField(name, value);
  };
  
  // Gestion des changements dans le formulaire de mot de passe
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };
  
  // Soumission du formulaire principal
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation des champs
    let isValid = true;
    const errors = {
      email: '',
      phone: '',
      socialSecurityNumber: ''
    };
    
    // Validation de l'email
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
      isValid = false;
    }
    
    // Validation du téléphone
    if (formData.phone && formData.phone.length !== 10) {
      errors.phone = 'Le numéro de téléphone doit contenir exactement 10 chiffres';
      isValid = false;
    }
    
    // Validation du numéro de sécurité sociale
    if (formData.socialSecurityNumber && formData.socialSecurityNumber.length !== 15) {
      errors.socialSecurityNumber = 'Le numéro de sécurité sociale doit contenir exactement 15 chiffres';
      isValid = false;
    }
    
    setValidationErrors(errors);
    
    if (!isValid) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    // Afficher la modal de confirmation
    setShowConfirmModal(true);
  };
  
  // Soumission après confirmation du mot de passe
  const handleConfirmedSubmit = async () => {
    try {
      // Vérifier le mot de passe avant de procéder
      if (!adminPassword) {
        setPasswordError('Veuillez entrer votre mot de passe');
        return;
      }
      
      // Vérifier le mot de passe auprès du serveur
      try {
        const verifyResponse = await api.post('/users/verify-password', {
          password: adminPassword
        });
        
        if (!verifyResponse.data.success) {
          setPasswordError('Mot de passe incorrect');
          return;
        }
      } catch (verifyErr) {
        setPasswordError(verifyErr.response?.data?.message || 'Erreur de vérification du mot de passe');
        return;
      }
      
      // Créer l'objet de données à envoyer
      const dataToSend = { ...formData };
      
      // Ajouter le mot de passe s'il est fourni
      if (passwordData.password) {
        if (passwordData.password !== passwordData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setShowConfirmModal(false);
          return;
        }
        
        if (passwordData.password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères');
          setShowConfirmModal(false);
          return;
        }
        
        dataToSend.password = passwordData.password;
      }
      
      // Envoyer les données au serveur
      await api.put(`/users/${id}`, dataToSend);
      setSuccess('Profil mis à jour avec succès');
      setShowConfirmModal(false);
      setAdminPassword('');
      
      // Rediriger vers la liste des utilisateurs après un court délai
      setTimeout(() => navigate('/users'), 2000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      if (err.response?.status === 401) {
        setPasswordError('Mot de passe incorrect');
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur');
        setShowConfirmModal(false);
      }
    }
  };

  // ===== FONCTIONS UTILITAIRES =====
  // Validation des champs
  const validateField = (name, value) => {
    let newErrors = { ...validationErrors };
    
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        newErrors.email = emailRegex.test(value) ? '' : 'Format d\'email invalide';
        break;
      case 'phone':
        newErrors.phone = value.length === 10 ? '' : 'Le numéro de téléphone doit contenir 10 chiffres';
        break;
      case 'socialSecurityNumber':
        newErrors.socialSecurityNumber = value.length === 15 ? '' : 'Le numéro de sécurité sociale doit contenir 15 chiffres';
        break;
      default:
        break;
    }
    
    setValidationErrors(newErrors);
  };

  // ===== RENDU =====
  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Image de théâtre floutée en arrière-plan de toute la page */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-25 z-0" 
        style={{ 
          backgroundImage: 'url("/images/theatre-background.jpg")', 
          filter: 'blur(2px)',
          top: '64px' // Commence après la navbar
        }}
      ></div>
      
      {/* En-tête */}
      <div className="bg-white/90 rounded-xl shadow-lg overflow-hidden mb-8 border-t-4 border-t-gold relative z-10">
        <div className="bg-gradient-to-r from-primary/90 to-accent/90 text-white p-6">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg mr-6 flex items-center justify-center">
              <UserCircleIcon className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Modifier l'utilisateur</h1>
              <p className="text-white/80 mt-1">{formData.firstName} {formData.lastName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages de succès et d'erreur */}
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-md relative z-10">
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md relative z-10">
          <div className="flex">
            <div className="py-1">
              <XMarkIcon className="h-6 w-6 text-red-500 mr-3" />
            </div>
            <div>
              <p className="font-bold">Erreur</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-white/90 rounded-xl shadow-lg overflow-hidden relative z-10">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-primary border-b-2 border-gold pb-2 mb-4">
                  Informations personnelles
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 ${validationErrors.email ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className={`form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 ${validationErrors.phone ? 'border-red-500' : ''}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Exactement 10 chiffres requis</p>
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
              </div>
              
              {/* Informations professionnelles */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-primary border-b-2 border-gold pb-2 mb-4">
                  Informations professionnelles
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
                  <input
                    type="text"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de sécurité sociale</label>
                  <input
                    type="text"
                    name="socialSecurityNumber"
                    value={formData.socialSecurityNumber}
                    onChange={handleChange}
                    maxLength={15}
                    pattern="[0-9]{15}"
                    className={`form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 ${validationErrors.socialSecurityNumber ? 'border-red-500' : ''}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Exactement 15 chiffres requis</p>
                  {validationErrors.socialSecurityNumber && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.socialSecurityNumber}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de congé spectacle</label>
                  <input
                    type="text"
                    name="showLeaveNumber"
                    value={formData.showLeaveNumber}
                    onChange={handleChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  >
                    <option value="">Sélectionner un rôle</option>
                    <option value="administrateur">Administrateur</option>
                    <option value="artiste">Artiste</option>
                    <option value="billeterie">Billetterie</option>
                    <option value="permanence">Permanence</option>
                    <option value="regie">Régie</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Section mot de passe */}
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-primary font-medium flex items-center"
              >
                {showPasswordSection ? '- Masquer' : '+ Afficher'} la section mot de passe
              </button>
              
              {showPasswordSection && (
                <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <h2 className="text-xl font-bold text-primary border-b-2 border-gold pb-2 mb-4">
                    Modifier le mot de passe
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                      <input
                        type="password"
                        name="password"
                        value={passwordData.password}
                        onChange={handlePasswordChange}
                        className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors duration-300"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Modal de confirmation avec mot de passe */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer les modifications</h3>
            <p className="text-gray-500 mb-4">
              Veuillez entrer votre mot de passe pour confirmer les modifications.
            </p>
            
            {/* Champ de mot de passe */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Votre mot de passe
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Entrez votre mot de passe"
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            
            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setAdminPassword('');
                  setPasswordError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmedSubmit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserEdit;