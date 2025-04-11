import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PencilIcon, CheckIcon, XMarkIcon, IdentificationIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, api } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    birthPlace: '',
    socialSecurityNumber: '',
    showLeaveNumber: '',
    iban: ''
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  // Ajout des états pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: '',
    socialSecurityNumber: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        birthPlace: user.birthPlace || '',
        socialSecurityNumber: user.socialSecurityNumber || '',
        showLeaveNumber: user.showLeaveNumber || '',
        iban: user.iban || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validation en temps réel
    validateField(name, value);
  };
  
  // Fonction de validation des champs
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
  
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Valider tous les champs avant soumission
    validateField('email', formData.email);
    validateField('phone', formData.phone);
    validateField('socialSecurityNumber', formData.socialSecurityNumber);
    
    // Vérifier s'il y a des erreurs de validation
    if (validationErrors.email || validationErrors.phone || validationErrors.socialSecurityNumber) {
      setError('Veuillez corriger les erreurs de validation avant de soumettre le formulaire.');
      return;
    }
    
    try {
      // Vérifier si un nouveau mot de passe est fourni
      if (passwordData.password) {
        if (passwordData.password !== passwordData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          return;
        }
        
        if (passwordData.password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères');
          return;
        }
      }
      
      // Créer l'objet de données à envoyer
      const dataToSend = { ...formData };
      
      // Ajouter le mot de passe s'il est fourni
      if (passwordData.password) {
        dataToSend.password = passwordData.password;
      }
      
      const response = await api.put('/users/profile', dataToSend);
      setSuccess('Profil mis à jour avec succès');
      setIsEditing(false);
      
      // Réinitialiser les champs de mot de passe
      setPasswordData({
        password: '',
        confirmPassword: ''
      });
      setShowPasswordSection(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  const cancelEdit = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        birthPlace: user.birthPlace || '',
        socialSecurityNumber: user.socialSecurityNumber || '',
        showLeaveNumber: user.showLeaveNumber || '',
        iban: user.iban || ''
      });
    }
    setIsEditing(false);
    setError('');
  };

  // Fonction pour générer une couleur de fond basée sur le nom
  const generateBackgroundColor = (name) => {
    const colors = [
      'bg-primary/10', 'bg-gold/20', 'bg-accent/10', 
      'bg-blue-100', 'bg-green-100', 'bg-purple-100'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

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
      
      {/* En-tête du profil avec image */}
      <div className="bg-white/90 rounded-xl shadow-lg overflow-hidden mb-8 border-t-4 border-t-gold relative z-10">
        <div className="bg-gradient-to-r from-primary/90 to-accent/90 text-white p-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg mb-4 md:mb-0 md:mr-6 flex items-center justify-center">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-4xl font-bold ${generateBackgroundColor(user?.firstName || '')}`}>
                  <span className="text-primary">
                    {user?.firstName?.charAt(0) || ''}{user?.lastName?.charAt(0) || ''}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold">{user?.firstName} {user?.lastName}</h1>
              <p className="text-white/80 mt-1">{user?.email}</p>
              <div className="mt-3 inline-block bg-white/20 px-3 py-1 rounded-full text-sm">
                {user?.role === 'administrateur' ? 'Administrateur' : 
                 user?.role === 'billeterie' ? 'Billetterie' : 
                 user?.role === 'permanence' ? 'Permanence' : 
                 user?.role === 'regie' ? 'Régie' : 
                 user?.role === 'technique' ? 'Technique' : 
                 user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Onglets de navigation */}
        <div className="flex border-b">
          <button 
            className={`flex-1 py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'personal' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-primary'}`}
            onClick={() => setActiveTab('personal')}
          >
            <IdentificationIcon className="h-5 w-5 inline mr-2" />
            Informations personnelles
          </button>
          <button 
            className={`flex-1 py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'professional' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-primary'}`}
            onClick={() => setActiveTab('professional')}
          >
            <DocumentTextIcon className="h-5 w-5 inline mr-2" />
            Informations professionnelles
          </button>
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

      {/* Formulaire de profil */}
      <div className="bg-white/90 rounded-xl shadow-lg overflow-hidden relative z-10">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">
              {activeTab === 'personal' ? 'Informations personnelles' : 'Informations professionnelles'}
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center text-sm px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors duration-300"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Modifier
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={updateProfile}
                  className="flex items-center text-sm px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Enregistrer
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center text-sm px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-300"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Annuler
                </button>
              </div>
            )}
          </div>

          <form onSubmit={updateProfile}>
            {activeTab === 'personal' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
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
                      disabled={!isEditing}
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
                      disabled={!isEditing}
                      className={`form-input w-full rounded-md ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50`}
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      className={`form-input w-full rounded-md ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50`}
                    />
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
                      disabled={!isEditing}
                      className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        disabled={!isEditing}
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
                        disabled={!isEditing}
                        className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de sécurité sociale</label>
                    <input
                      type="text"
                      name="socialSecurityNumber"
                      value={formData.socialSecurityNumber}
                      onChange={handleChange}
                      disabled={!isEditing}
                      maxLength={15}
                      pattern="[0-9]{15}"
                      className={`form-input w-full rounded-md ${validationErrors.socialSecurityNumber ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50`}
                    />
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
                      disabled={!isEditing}
                      className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                    <input
                      type="text"
                      name="iban"
                      value={formData.iban}
                      onChange={handleChange}
                      disabled={!isEditing}
                      maxLength={34}
                      className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: 34 caractères maximum</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
        
        {/* Pied de page */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 relative z-10">
          <p className="text-xs text-gold font-medium">Planning-Corporate</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;