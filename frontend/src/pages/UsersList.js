import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getRoleColor } from '../utils/roleColors';
import { AuthContext } from '../context/AuthContext';

const UsersList = () => {
  const navigate = useNavigate();
  const { api } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    address: '',
    birthDate: '',
    birthPlace: '',
    socialSecurityNumber: '',
    showLeaveNumber: '',
    phone: '',
    iban: '',
    role: 'artiste'
  });

  // Add fetchUsers function with useCallback
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.users);
      setFilteredUsers(response.data.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    }
  }, [api]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = (
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesRole = roleFilter ? user.role === roleFilter : true;
      return matchesSearch && matchesRole;
    });
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/register', newUser);
      setSuccess('Utilisateur créé avec succès');
      setShowAddModal(false);
      // Refresh users list
      fetchUsers();
      // Reset form
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        address: '',
        birthDate: '',
        birthPlace: '',
        socialSecurityNumber: '',
        showLeaveNumber: '',
        phone: '',
        iban: '',
        role: 'artiste'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const confirmDelete = (userId) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${userToDelete}`);
      setSuccess('Utilisateur supprimé avec succès');
      setShowDeleteConfirm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleEditUser = (userId) => {
    navigate(`/users/edit/${userId}`);
  };

  // Function to get role display name
  const getRoleName = (role) => {
    const roles = {
      'administrateur': 'Administrateur',
      'artiste': 'Artiste',
      'permanence': 'Permanence',
      'billeterie': 'Billeterie',
      'regie': 'Régie'
    };
    return roles[role] || role;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-t-gold">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-primary mb-4 md:mb-0">Gestion des Utilisateurs</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un utilisateur
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md" role="alert">
          <p className="font-bold">Erreur</p>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-md" role="alert">
          <p className="font-bold">Succès</p>
          <p>{success}</p>
        </div>
      )}

      <div className="mb-8 bg-gray-50 p-4 rounded-lg shadow-sm border border-gold/30">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-gold focus:ring focus:ring-gold/30 focus:ring-opacity-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="form-select rounded-md border-gray-300 shadow-sm focus:border-gold focus:ring focus:ring-gold/30 focus:ring-opacity-50 bg-white"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tous les rôles</option>
            <option value="administrateur">Administrateur</option>
            <option value="artiste">Artiste</option>
            <option value="permanence">Permanence</option>
            <option value="billeterie">Billeterie</option>
            <option value="regie">Régie</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 hover:border-gold">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-primary/10 to-white">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-navy">
                  {user.firstName} {user.lastName}
                </h3>
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                  {getRoleName(user.role)}
                </span>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <p className="text-sm text-gray-600">{user.phone}</p>
              </div>
              
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-600 truncate">{user.address}</p>
              </div>
            </div>
            
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
              {/* Fix: Wrap these buttons in a fragment or div */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditUser(user.id)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-navy bg-gold/20 hover:bg-gold/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold transition"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Modifier
                </button>
                <button
                  onClick={() => confirmDelete(user.id)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">Ajouter un utilisateur</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={newUser.firstName}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={newUser.lastName}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={newUser.phone}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={newUser.address}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={newUser.birthDate}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
                  <input
                    type="text"
                    id="birthPlace"
                    name="birthPlace"
                    value={newUser.birthPlace}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="socialSecurityNumber" className="block text-sm font-medium text-gray-700 mb-1">Numéro de sécurité sociale</label>
                <input
                  type="text"
                  id="socialSecurityNumber"
                  name="socialSecurityNumber"
                  value={newUser.socialSecurityNumber}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="showLeaveNumber" className="block text-sm font-medium text-gray-700 mb-1">Numéro de congé spectacle</label>
                <input
                  type="text"
                  id="showLeaveNumber"
                  name="showLeaveNumber"
                  value={newUser.showLeaveNumber}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                <input
                  type="text"
                  id="iban"
                  name="iban"
                  value={newUser.iban}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                >
                  <option value="artiste">Artiste</option>
                  <option value="administrateur">Administrateur</option>
                  <option value="permanence">Permanence</option>
                  <option value="billeterie">Billeterie</option>
                  <option value="regie">Régie</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-500 mb-6">Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;