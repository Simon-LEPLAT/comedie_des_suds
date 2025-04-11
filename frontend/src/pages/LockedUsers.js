import React, { useState, useEffect, useContext, useCallback } from 'react';
import { LockOpenIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getRoleColor } from '../utils/roleColors';
import { AuthContext } from '../context/AuthContext';

const LockedUsers = () => {
  const { api } = useContext(AuthContext);
  const [lockedUsers, setLockedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [userToUnlock, setUserToUnlock] = useState(null);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);

  const fetchLockedUsers = useCallback(async () => {
    try {
      const response = await api.get('/users/locked');
      const users = response.data.data.users || [];
      setLockedUsers(users);
      setFilteredUsers(users);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs bloqués');
    }
  }, [api]);

  useEffect(() => {
    fetchLockedUsers();
  }, [fetchLockedUsers]);

  useEffect(() => {
    const filtered = lockedUsers.filter(user => {
      const matchesSearch = (
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesRole = roleFilter ? user.role === roleFilter : true;
      return matchesSearch && matchesRole;
    });
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, lockedUsers]);

  const handleUnlockUser = async () => {
    try {
      await api.post(`/users/unlock/${userToUnlock}`);
      setSuccess('Utilisateur débloqué avec succès');
      setShowUnlockConfirm(false);
      fetchLockedUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du déblocage de l\'utilisateur');
    }
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
        <h1 className="text-2xl font-bold text-primary mb-4 md:mb-0">
          Utilisateurs Bloqués
        </h1>
      </div>

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

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Rechercher un utilisateur bloqué..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            {/* En-tête de la carte avec la couleur primaire du site */}
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
                {/* Initiales dans un cercle avec couleur du rôle */}
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
              
              {/* Informations de contact avec bordure dorée */}
              <div className="space-y-2 border-t border-gold pt-3">
                <div className="grid grid-cols-3 text-sm">
                  <div className="text-primary font-medium">Email</div>
                  <div className="col-span-2 font-mono truncate text-charcoal">{user.email}</div>
                </div>
                
                <div className="grid grid-cols-3 text-sm">
                  <div className="text-primary font-medium">Téléphone</div>
                  <div className="col-span-2 font-mono text-charcoal">{user.phone || 'Non renseigné'}</div>
                </div>
                
                <div className="grid grid-cols-3 text-sm">
                  <div className="text-primary font-medium">Tentatives</div>
                  <div className="col-span-2 font-mono text-red-600 font-medium">{user.loginAttempts || 0} échecs</div>
                </div>
              </div>
            </div>
            
            {/* Pied de carte avec actions */}
            <div className="bg-gray-50 border-t border-gray-300 px-4 py-3 flex justify-between">
              <div className="text-xs text-gold font-medium">Planning-Corporate</div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setUserToUnlock(user.id);
                    setShowUnlockConfirm(true);
                  }}
                  className="text-xs text-green-600 hover:text-green-800 flex items-center transition-colors duration-200"
                >
                  <LockOpenIcon className="h-3 w-3 mr-1" />
                  Débloquer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">Aucun utilisateur bloqué trouvé</p>
        </div>
      )}

      {/* Modal de confirmation de déblocage */}
      {showUnlockConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer le déblocage</h3>
            <p className="text-gray-500 mb-6">Êtes-vous sûr de vouloir débloquer cet utilisateur ? Il pourra à nouveau se connecter.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUnlockConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Annuler
              </button>
              <button
                onClick={handleUnlockUser}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Débloquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LockedUsers;