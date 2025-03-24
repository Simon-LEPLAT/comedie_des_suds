import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add token refresh function
  const refreshToken = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        };
        
        const res = await axios.get('http://localhost:5000/api/users/profile', config);
        setUser(res.data.data.user);
        setToken(storedToken);
      } catch (err) {
        console.error('Token refresh error:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, []); // Empty dependency array since this function doesn't depend on any external values

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${storedToken}`
            }
          };
          
          const res = await axios.get('http://localhost:5000/api/users/profile', config);
          setUser(res.data.data.user);
          setToken(storedToken);
        } catch (err) {
          console.error('Token validation error:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setError('Session expirée, veuillez vous reconnecter');
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const updateProfile = async (userData) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const res = await axios.put('http://localhost:5000/api/users/profile', userData, config);
      
      if (res.data.status === 'success') {
        setUser(res.data.data.user);
      }
      return res.data;
    } catch (err) {
      console.error('Update profile error:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du profil');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/users/register', userData);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.data.user);
      }
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', { email, password });
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.data.user);
      }
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};