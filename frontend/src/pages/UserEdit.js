import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useContext(AuthContext);
  
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${id}`, formData);
      setSuccess('Profil mis à jour avec succès');
      setTimeout(() => navigate('/users'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8 mt-10">
      <h2 className="text-2xl font-bold text-primary mb-6">Modifier l'utilisateur</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Prénom</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Nom</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Téléphone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Date de naissance</label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Lieu de naissance</label>
          <input
            type="text"
            name="birthPlace"
            value={formData.birthPlace}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Numéro de sécurité sociale</label>
          <input
            type="text"
            name="socialSecurityNumber"
            value={formData.socialSecurityNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Numéro de congé spectacle</label>
          <input
            type="text"
            name="showLeaveNumber"
            value={formData.showLeaveNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">IBAN</label>
          <input
            type="text"
            name="iban"
            value={formData.iban}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Rôle</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="artiste">Artiste</option>
            <option value="administrateur">Administrateur</option>
            <option value="permanence">Permanence</option>
            <option value="billeterie">Billeterie</option>
            <option value="regie">Régie</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2">Adresse</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            rows="3"
            required
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/80 transition-colors"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserEdit;