import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Create a custom axios instance with default config
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor to add token to all requests
  api.interceptors.request.use(
    (config) => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle token errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Only handle auth errors if we're initialized
      if (isInitialized && (error.response?.status === 401 || error.response?.status === 403)) {
        // Don't clear token during profile fetch to prevent logout loops
        if (!error.config.url.includes('/users/profile')) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      return Promise.reject(error);
    }
  );

  const refreshToken = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      // Use direct axios call to avoid interceptor loop
      const res = await axios.get('http://localhost:5000/api/users/profile', {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      });
      
      if (res.data.status === 'success') {
        setUser(res.data.data.user);
        setToken(storedToken);
      } else {
        // Clear token if response is not successful
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      // Only clear token if it's not a network error
      if (err.response) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  // Update the login function to properly set the user state
  const login = async (email, password, recaptchaToken) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/users/login', {
        email,
        password,
        recaptchaToken
      });
      
      const { token, user } = response.data.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      setToken(token);
      
      // Set the user state
      setUser(user);
      
      console.log('Login successful, user state set to:', user);
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue lors de la connexion';
      const remainingAttempts = err.response?.data?.remainingAttempts;
      
      setError(errorMessage);
      
      return { 
        success: false, 
        message: errorMessage,
        remainingAttempts
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/users/register', userData);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.data.user);
        setError(null);
      }
      
      return res.data;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'inscription');
      throw err;
    }
  };

  const updateProfile = async (userData) => {
    try {
      const res = await api.put('/users/profile', userData);
      
      if (res.data.status === 'success') {
        setUser(res.data.data.user);
        setError(null);
      }
      
      return res.data;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du profil');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      setError,
      login,
      logout,
      register,
      updateProfile,
      refreshToken,
      api
    }}>
      {children}
    </AuthContext.Provider>
  );
};