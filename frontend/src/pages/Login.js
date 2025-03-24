import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
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
    
    try {
      await login(email, password);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Une erreur est survenue');
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl mt-10">
      <div className="p-8">
        <div className="uppercase tracking-wide text-sm text-primary font-semibold mb-6">Connexion</div>
        
        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{formError}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="form-input"
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Mot de passe
            </label>
            <input
              className="form-input"
              id="password"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <button
              className="btn-primary"
              type="submit"
            >
              Se connecter
            </button>
            <Link to="/register" className="inline-block align-baseline font-bold text-sm text-primary hover:text-primary/80">
              Créer un compte
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;