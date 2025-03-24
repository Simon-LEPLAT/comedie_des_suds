import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier les permissions d'administrateur si nécessaire
  if (adminOnly && user.role !== 'administrateur') {
    return <Navigate to="/dashboard" replace />;
  }

  // Afficher le contenu protégé
  return children;
};

export default PrivateRoute;