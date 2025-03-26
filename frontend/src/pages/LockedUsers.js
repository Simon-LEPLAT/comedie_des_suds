import React, { useState, useEffect, useContext, useCallback } from 'react';
// Remove the MagnifyingGlassIcon import
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

  const handleUnlock = async (userId) => {
    try {
      await api.post(`/users/unlock/${userId}`);
      setSuccess('Utilisateur débloqué avec succès');
      await fetchLockedUsers(); // Refresh the list after unlocking
      setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du déblocage');
      setTimeout(() => setError(null), 3000); // Clear error message after 3 seconds
    }
  };

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
        <h1 className="text-2xl font-bold text-primary mb-4 md:mb-0 flex items-center">
          <span className="text-gold mr-2">🔒</span>
          Utilisateurs Bloqués
        </h1>
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
            {/* Remove the magnifying glass icon and its container */}
            <input
              type="text"
              placeholder="Rechercher un utilisateur bloqué..."
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
              
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-600 truncate">{user.address}</p>
              </div>
              
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm text-red-600">Compte bloqué</p>
              </div>
            </div>
            
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => handleUnlock(user.id)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Débloquer
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur bloqué trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tous les utilisateurs ont accès à leur compte.
          </p>
        </div>
      )}
    </div>
  );
};

export default LockedUsers;