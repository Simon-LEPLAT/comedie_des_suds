import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getRoleColor } from '../utils/roleColors';
import { AuthContext } from '../context/AuthContext';

const UsersList = () => {
  const navigate = useNavigate();
  const { api } = useContext(AuthContext);
  
  // ===== ÉTATS =====
  // États principaux
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // États de filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // États des modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // État du formulaire d'ajout d'utilisateur
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

  // ===== FONCTIONS DE RÉCUPÉRATION DE DONNÉES =====
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.users);
      setFilteredUsers(response.data.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    }
  }, [api]);

  // ===== EFFETS =====
  // Chargement initial des utilisateurs
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtrage des utilisateurs
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

  // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====
  // Gestion du formulaire d'ajout d'utilisateur
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  // Gestion de la suppression d'utilisateur
  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
    // Réinitialiser le mot de passe et les erreurs
    setAdminPassword('');
    setPasswordError('');
  };

  const handleDeleteUser = async () => {
    try {
      // Vérifier le mot de passe avant de supprimer
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
      
      // Si le mot de passe est correct, procéder à la suppression
      await api.delete(`/users/${userToDelete.id}`);
      setSuccess('Utilisateur supprimé avec succès');
      setShowDeleteConfirm(false);
      setAdminPassword('');
      fetchUsers();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      if (err.response?.status === 401) {
        setPasswordError('Mot de passe incorrect');
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  // Navigation vers la page d'édition
  const handleEditUser = (userId) => {
    navigate(`/users/edit/${userId}`);
  };

  // ===== FONCTIONS UTILITAIRES =====
  // Fonction pour obtenir le nom d'affichage du rôle
  const getRoleName = (role) => {
    const roles = {
      'administrateur': 'Administrateur',
      'artiste': 'Artiste',
      'permanence': 'Permanence',
      'billeterie': 'Billetterie',
      'regie': 'Régie'
    };
    return roles[role] || role;
  };

  // ===== RENDU =====
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-t-gold">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-primary mb-4 md:mb-0">
          Gestion des Utilisateurs
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors duration-300 shadow-md"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md">
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

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-md">
          <p>{success}</p>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm"
        >
          <option value="">Tous les rôles</option>
          <option value="administrateur">Administrateur</option>
          <option value="artiste">Artiste</option>
          <option value="billeterie">Billetterie</option>
          <option value="permanence">Permanence</option>
          <option value="regie">Régie</option>
        </select>
      </div>

      {/* Liste des utilisateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            {/* En-tête de la carte */}
            <div className="bg-primary px-4 py-3 border-b border-gray-300">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <div className="text-xs font-mono text-gold">ID: {user.id}</div>
              </div>
            </div>
            
            {/* Corps de la carte */}
            <div className="p-4">
              {/* Section principale */}
              <div className="flex mb-4">
                {/* Initiales dans un cercle */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center mr-4 border-2 border-primary"
                     style={{ backgroundColor: 'rgba(128, 0, 0, 0.1)' }}>
                  <span className="text-xl font-bold text-primary">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
                
                {/* Informations principales */}
                <div className="flex flex-col justify-center">
                  <div className="text-sm text-gray-500 mb-1">Fonction</div>
                  <div className="text-sm font-medium rounded px-2 py-1 inline-block"
                       style={{ 
                         backgroundColor: getRoleColor(user.role, 0.15),
                         color: getRoleColor(user.role, 1),
                         borderWidth: '1px',
                         borderColor: getRoleColor(user.role, 0.5)
                       }}>
                    {user.role === 'administrateur' ? 'Administrateur' : 
                     user.role === 'billeterie' ? 'Billetterie' : 
                     user.role === 'permanence' ? 'Permanence' : 
                     user.role === 'regie' ? 'Régie' : 
                     user.role === 'technique' ? 'Technique' : 
                     user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                </div>
              </div>
              
              {/* Informations de contact */}
              <div className="space-y-2 border-t border-gold pt-3">
                <div className="grid grid-cols-3 text-sm">
                  <div className="text-primary font-medium">Email</div>
                  <div className="col-span-2 font-mono truncate text-charcoal">
                    {user.email ? (
                      <a 
                        href={`mailto:${user.email}`} 
                        className="text-primary hover:text-accent hover:underline"
                      >
                        {user.email}
                      </a>
                    ) : 'Non renseigné'}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 text-sm">
                  <div className="text-primary font-medium">Téléphone</div>
                  <div className="col-span-2 font-mono text-charcoal">
                    {user.phone ? (
                      <a 
                        href={`tel:${user.phone}`} 
                        className="text-primary hover:text-accent hover:underline"
                      >
                        {user.phone}
                      </a>
                    ) : 'Non renseigné'}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 text-sm">
                  <div className="text-primary font-medium">Adresse</div>
                  <div className="col-span-2 truncate text-charcoal">{user.address || 'Non renseignée'}</div>
                </div>
              </div>
            </div>
            
            {/* Pied de carte avec actions */}
            <div className="bg-gray-50 border-t border-gray-300 px-4 py-3 flex justify-between">
              <div className="text-xs text-gold font-medium">Planning-Corporate</div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate(`/users/edit/${user.id}`)}
                  className="text-xs text-primary hover:text-accent flex items-center transition-colors duration-200"
                >
                  <PencilIcon className="h-3 w-3 mr-1" />
                  Modifier
                </button>
                <button
                  onClick={() => confirmDelete(user)}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center transition-colors duration-200"
                >
                  <TrashIcon className="h-3 w-3 mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun utilisateur trouvé */}
      {filteredUsers.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">Aucun utilisateur trouvé</p>
        </div>
      )}
      
      {/* Modal d'ajout d'utilisateur */}
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
              {/* Informations personnelles */}
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
              
              {/* Informations de contact */}
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
              
              {/* Informations professionnelles */}
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
              
              {/* Boutons d'action */}
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

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-500 mb-4">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <span className="font-semibold">{userToDelete?.firstName} {userToDelete?.lastName}</span> ? Cette action est irréversible.
            </p>
            
            {/* Champ de mot de passe */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Veuillez entrer votre mot de passe pour confirmer
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Votre mot de passe"
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            
            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setAdminPassword('');
                  setPasswordError('');
                }}
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