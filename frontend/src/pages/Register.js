import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    birthDate: '',
    birthPlace: '',
    socialSecurityNumber: '',
    showLeaveNumber: '',
    phone: '',
    iban: '',
    role: 'artiste'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const userData = { ...formData };
      delete userData.confirmPassword;
      await register(userData);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-6xl w-full flex overflow-hidden rounded-xl shadow-2xl">
        {/* Colonne de gauche - Image théâtrale */}
        <div className="hidden lg:block w-1/3 bg-primary relative">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div 
            className="h-full bg-cover bg-center" 
            style={{ 
              backgroundImage: "url('/images/theatre-masks.jpg')", 
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
            <h2 className="text-3xl font-bold mb-4 text-gold drop-shadow-lg">Planning-Corporate</h2>
            <p className="text-xl text-center italic text-offwhite drop-shadow-md">
              "Le théâtre est une nourriture aussi indispensable à la vie que le pain et le vin."
            </p>
            <p className="mt-2 text-gold">- Molière</p>
          </div>
        </div>
        
        {/* Colonne de droite - Formulaire d'inscription */}
        <div className="w-full lg:w-2/3 bg-white p-6 sm:p-8">
          <div className="mb-6 text-center">
            <img 
              src="/logo-noir.png" 
              alt="Planning-Corporate" 
              className="h-32 mx-auto mb-4" 
            />
            <h2 className="text-2xl font-bold text-primary">Inscription</h2>
            <p className="text-gray-600 mt-2">Créez votre compte pour accéder à la plateforme</p>
          </div>
          
          {formError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
              <p className="font-bold">Erreur</p>
              <p>{formError}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse *
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance *
                </label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div>
                <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu de naissance *
                </label>
                <input
                  id="birthPlace"
                  name="birthPlace"
                  type="text"
                  required
                  value={formData.birthPlace}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div>
                <label htmlFor="socialSecurityNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de sécurité sociale *
                </label>
                <input
                  id="socialSecurityNumber"
                  name="socialSecurityNumber"
                  type="text"
                  required
                  value={formData.socialSecurityNumber}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div>
                <label htmlFor="showLeaveNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de congé spectacle *
                </label>
                <input
                  id="showLeaveNumber"
                  name="showLeaveNumber"
                  type="text"
                  required
                  value={formData.showLeaveNumber}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-1">
                  IBAN *
                </label>
                <input
                  id="iban"
                  name="iban"
                  type="text"
                  required
                  value={formData.iban}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                >
                  <option value="artiste">Artiste</option>
                  <option value="permanence">Permanence</option>
                  <option value="billeterie">Billeterie</option>
                  <option value="regie">Régie</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold transition-all duration-300"
              >
                S'inscrire
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-gold transition-colors">
                Connectez-vous
              </Link>
            </p>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 text-center">
              En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;