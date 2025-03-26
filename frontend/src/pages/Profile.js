import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const response = await api.put('/users/profile', formData);
      setSuccess('Profil mis à jour avec succès');
      setIsEditing(false);
      // Update the user context if needed
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Mon Profil</h1>
              <p className="text-gold opacity-90 mt-1">Gérez vos informations personnelles</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-gold text-primary rounded-lg hover:bg-gold/90 transition-all shadow-md"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Modifier
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={cancelEdit}
                  className="flex items-center px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-all shadow-md"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Annuler
                </button>
                <button
                  onClick={updateProfile}
                  className="flex items-center px-4 py-2 bg-gold text-primary rounded-lg hover:bg-gold/90 transition-all shadow-md"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Alerts */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-6 mt-6 rounded shadow-md" role="alert">
            <p className="font-bold">Erreur</p>
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mx-6 mt-6 rounded shadow-md" role="alert">
            <p className="font-bold">Succès</p>
            <p>{success}</p>
          </div>
        )}
        
        {/* Profile Form */}
        <form className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-primary border-b border-gray-200 pb-2 mb-4">
                Informations personnelles
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`form-input ${isEditing ? 'bg-white border-gold focus:ring-gold' : 'bg-gray-50'}`}
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
                  className={`form-input ${isEditing ? 'bg-white border-gold focus:ring-gold' : 'bg-gray-50'}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`form-input ${isEditing ? 'bg-white border-gold focus:ring-gold' : 'bg-gray-50'}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de sécurité sociale</label>
                <input
                  type="text"
                  name="socialSecurityNumber"
                  value={formData.socialSecurityNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`form-input ${isEditing ? 'bg-white border-gold focus:ring-gold' : 'bg-gray-50'}`}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`form-input ${isEditing ? 'bg-white border-gold focus:ring-gold' : 'bg-gray-50'}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`form-input ${isEditing ? 'bg-white border-gold focus:ring-gold' : 'bg-gray-50'}`}
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
                  className={`form-input ${isEditing ? 'bg-white border-gold focus:ring-gold' : 'bg-gray-50'}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de congé spectacle</label>
                <input
                  type="text"
                  name="showLeaveNumber"
                  value={formData.showLeaveNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`form-input ${isEditing ? 'bg-white border-gold focus:ring-gold' : 'bg-gray-50'}`}
                />
              </div>
            </div>
            
            {/* Address and Banking Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-primary border-b border-gray-200 pb-2 mb-4 mt-4">
                Adresse et coordonnées bancaires
              </h2>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                className={`form-input ${isEditing ? 'bg-white border-gold focus:ring-gold' : 'bg-gray-50'}`}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
              <input
                type="text"
                name="iban"
                value={formData.iban}
                onChange={handleChange}
                disabled={!isEditing}
                className={`form-input ${isEditing ? 'bg-white border-gold focus:ring-gold' : 'bg-gray-50'}`}
              />
            </div>
          </div>
          
          {/* Mobile Edit Buttons (visible only on small screens) */}
          {isEditing && (
            <div className="mt-8 flex justify-end space-x-3 md:hidden">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg shadow-sm hover:bg-red-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={updateProfile}
                className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-accent"
              >
                Enregistrer
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;