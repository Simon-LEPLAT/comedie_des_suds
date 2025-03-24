import React, { useState, useEffect, useContext } from 'react';
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

  const fetchLockedUsers = async () => {
    try {
      const response = await api.get('/users/locked');
      setLockedUsers(response.data.data.users || []);
      setFilteredUsers(response.data.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs bloqués');
    }
  };

  useEffect(() => {
    fetchLockedUsers();
  }, []);

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
      fetchLockedUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du déblocage');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-primary mb-6">Utilisateurs bloqués</h2>

      {/* Search and Filter Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            className="w-full p-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full p-2 border rounded-md"
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

      {(error || success) && (
        <div className={`${error ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} px-4 py-3 rounded mb-4 border`}>
          {error || success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {filteredUsers.length === 0 ? (
          <p className="text-gray-600">Aucun utilisateur bloqué</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-primary mb-4">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="space-y-2 text-gray-600 mb-4">
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p>
                    <span className="font-medium">Rôle:</span>{' '}
                    <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </p>
                  <p><span className="font-medium">Dernière tentative:</span> {new Date(user.lastLoginAttempt).toLocaleString()}</p>
                  <p><span className="font-medium">Tentatives:</span> {user.loginAttempts}</p>
                </div>
                <button
                  onClick={() => handleUnlock(user.id)}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/80 transition-colors"
                >
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LockedUsers;