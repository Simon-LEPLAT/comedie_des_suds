import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// This looks correct
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'administrateur') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;