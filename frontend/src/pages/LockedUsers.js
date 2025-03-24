import React, { useState, useEffect, useContext, useCallback } from 'react';
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-primary mb-6">Utilisateurs bloqués</h2>

      {(error || success) && (
        <div className={`${error ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} px-4 py-3 rounded mb-4 border`}>
          {error || success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              className="w-full p-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="p-2 border rounded-md"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex flex-col space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => handleUnlock(user.id)}
                  className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors duration-300 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0v2h2V7a5 5 0 00-5-5z" />
                  </svg>
                  <span>Débloquer l'utilisateur</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LockedUsers;