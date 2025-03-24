import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { getRoleColor } from '../utils/roleColors';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data.users);
      setFilteredUsers(response.data.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/users/register', newUser, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSuccess('Utilisateur créé avec succès');
      setShowAddModal(false);
      // Refresh users list
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Utilisateur supprimé avec succès');
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-primary">Liste des utilisateurs</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/80 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Ajouter un utilisateur
        </button>
      </div>

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
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="p-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
            <div key={user.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/users/${user.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Téléphone:</span> {user.phone}</p>
                <p><span className="font-medium">Adresse:</span> {user.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-2xl font-bold text-primary mb-4">Ajouter un utilisateur</h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Prénom</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Nom</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded-md"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Mot de passe</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-md"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Téléphone</label>
                <input
                  type="tel"
                  className="w-full p-2 border rounded-md"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Date de naissance</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={newUser.birthDate}
                  onChange={(e) => setNewUser({...newUser, birthDate: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Lieu de naissance</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={newUser.birthPlace}
                  onChange={(e) => setNewUser({...newUser, birthPlace: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Numéro de sécurité sociale</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={newUser.socialSecurityNumber}
                  onChange={(e) => setNewUser({...newUser, socialSecurityNumber: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Numéro de congé spectacle</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={newUser.showLeaveNumber}
                  onChange={(e) => setNewUser({...newUser, showLeaveNumber: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">IBAN</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={newUser.iban}
                  onChange={(e) => setNewUser({...newUser, iban: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Rôle</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
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
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  value={newUser.address}
                  onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                  required
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/80"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;