import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  
  const { login, user, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    
    if (error) {
      setFormError(error);
      setError(null);
    }
  }, [user, navigate, error, setError]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setRemainingAttempts(null);
    
    try {
      await login(email, password);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Une erreur est survenue');
      
      // Check if the response contains remaining attempts information
      if (err.response?.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.response?.data?.remainingAttempts);
      }
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl mt-10">
      <div className="p-8">
        <div className="uppercase tracking-wide text-sm text-primary font-semibold mb-6">Connexion</div>
        
        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{formError}</span>
            {remainingAttempts !== null && (
              <p className="mt-1 text-sm">
                Il vous reste <span className="font-bold">{remainingAttempts}</span> tentative{remainingAttempts > 1 ? 's' : ''} avant le blocage de votre compte.
              </p>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;