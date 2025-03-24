import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile, error, setError } = useContext(AuthContext);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        address: user.address || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        birthPlace: user.birthPlace || '',
        socialSecurityNumber: user.socialSecurityNumber || '',
        showLeaveNumber: user.showLeaveNumber || '',
        phone: user.phone || '',
        iban: user.iban || '',
        role: user.role || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    try {
      await updateProfile(formData);
      setSuccessMessage('Profil mis à jour avec succès');
      window.scrollTo(0, 0);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Une erreur est survenue');
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mt-10 border-t-4 border-primary">
      <div className="p-8">
        <div className="uppercase tracking-wide text-xl text-primary font-bold mb-6 text-center">Mon Profil</div>
        
        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{formError}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
              Prénom
            </label>
            <input
              className="form-input w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
              Nom
            </label>
            <input
              className="form-input w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="form-input w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
              Téléphone
            </label>
            <input
              className="form-input w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              id="phone"
              name="phone"
              type="tel"
              pattern="[0-9]{10}"
              required
              value={formData.phone}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">Format: 10 chiffres requis</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
              Adresse
            </label>
            <input
              className="form-input w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              id="address"
              name="address"
              type="text"
              required
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="birthDate">
              Date de naissance
            </label>
            <input
              className="form-input w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              id="birthDate"
              name="birthDate"
              type="date"
              required
              value={formData.birthDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="birthPlace">
              Lieu de naissance
            </label>
            <input
              className="form-input w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              id="birthPlace"
              name="birthPlace"
              type="text"
              required
              value={formData.birthPlace}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="socialSecurityNumber">
              Numéro de sécurité sociale
            </label>
            <input
              className="form-input w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              id="socialSecurityNumber"
              name="socialSecurityNumber"
              type="text"
              pattern="[0-9]{15}"
              required
              value={formData.socialSecurityNumber}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">Format: 15 chiffres requis</p>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="showLeaveNumber">
              Numéro congés spectacles
            </label>
            <input
              className="form-input w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              id="showLeaveNumber"
              name="showLeaveNumber"
              type="text"
              required
              value={formData.showLeaveNumber}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="iban">
              IBAN
            </label>
            <input
              className="form-input w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              id="iban"
              name="iban"
              type="text"
              required
              value={formData.iban}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
              Rôle
            </label>
            {user?.role === 'administrateur' ? (
              <select
                className="form-select w-full rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="administrateur">Administrateur</option>
                <option value="artiste">Artiste</option>
                <option value="billeterie">Billeterie</option>
                <option value="permanence">Permanence</option>
                <option value="regie">Régie</option>
              </select>
            ) : (
              <input
                className="form-input w-full rounded-md border-gray-300 bg-gray-100 cursor-not-allowed"
                id="role"
                name="role"
                type="text"
                value={formData.role}
                disabled
              />
            )}
            {!user?.role === 'administrateur' && (
              <p className="text-xs text-gray-500 mt-1">Le rôle ne peut être modifié que par un administrateur</p>
            )}
          </div>

          <div className="md:col-span-2 mt-6">
            <button
              type="submit"
              className="w-full bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-accent transition-colors duration-300 text-lg"
            >
              Mettre à jour le profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;