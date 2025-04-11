import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import ReCAPTCHA from 'react-google-recaptcha';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  
  const recaptchaRef = useRef(null);
  const { login, user, error, setError, api } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("Current user state:", user);
    if (user) {
      console.log("Redirecting to dashboard...");
      navigate('/dashboard');
    }
    
    if (error) {
      setFormError(error);
      setError(null);
    }
  }, [user, navigate, error, setError]);
  
  const handleCaptchaChange = (value) => {
    setCaptchaVerified(!!value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setRemainingAttempts(null);
    
    if (!captchaVerified) {
      setFormError('Veuillez confirmer que vous n\'êtes pas un robot');
      return;
    }
    
    try {
      // Obtenir le token reCAPTCHA
      const recaptchaToken = recaptchaRef.current.getValue();
      
      // Passer le token au serveur lors de la connexion
      await login(email, password, recaptchaToken);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Une erreur est survenue');
      
      // Reset captcha on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaVerified(false);
      }
      
      // Check if the response contains remaining attempts information
      if (err.response?.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.response?.data?.remainingAttempts);
      }
    }
  };
  
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setFormError('');
    setResetSuccess('');
    
    if (!forgotPasswordEmail) {
      setFormError('Veuillez entrer votre adresse email');
      return;
    }
    
    try {
      const response = await api.post('/users/forgot-password', { email: forgotPasswordEmail });
      setResetSuccess(response.data.message || 'Un email de réinitialisation a été envoyé à votre adresse email');
      setForgotPasswordEmail('');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi de l\'email');
    }
  };
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-5xl w-full flex overflow-hidden rounded-xl shadow-2xl">
        {/* Colonne de gauche - Image théâtrale */}
        <div className="hidden md:block w-1/2 bg-primary relative">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div 
            className="h-full bg-cover bg-center" 
            style={{ 
              backgroundImage: "url('/images/theatre-curtain.jpg')", 
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
            <h2 className="text-3xl font-bold mb-4 text-gold drop-shadow-lg">Planning-Corporate</h2>
            <p className="text-xl text-center italic text-offwhite drop-shadow-md">
              "Le théâtre est le premier sérum que l'homme ait inventé pour se protéger de la maladie de l'angoisse."
            </p>
            <p className="mt-2 text-gold">- Jean-Louis Barrault</p>
          </div>
        </div>
        
        {/* Colonne de droite - Formulaire de connexion ou de réinitialisation */}
        <div className="w-full md:w-1/2 bg-white p-8 sm:p-12">
          <div className="mb-8 text-center">
            <img 
              src="/logo-noir.png" 
              alt="Planning-Corporate" 
              className="h-32 mx-auto mb-4" 
            />
            <h2 className="text-2xl font-bold text-primary">
              {showForgotPassword ? 'Réinitialisation du mot de passe' : 'Connexion'}
            </h2>
            <p className="text-gray-600 mt-2">
              {showForgotPassword 
                ? 'Entrez votre email pour réinitialiser votre mot de passe' 
                : 'Accédez à votre espace personnel'}
            </p>
          </div>
          
          {formError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
              <p className="font-bold">Erreur</p>
              <p>{formError}</p>
              {remainingAttempts !== null && (
                <p className="mt-1 text-sm">
                  Il vous reste <span className="font-bold">{remainingAttempts}</span> tentative{remainingAttempts > 1 ? 's' : ''} avant le blocage de votre compte.
                </p>
              )}
            </div>
          )}
          
          {resetSuccess && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
              <p className="font-bold">Succès</p>
              <p>{resetSuccess}</p>
            </div>
          )}
          
          {!showForgotPassword ? (
            // Formulaire de connexion
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                  placeholder="votre@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:text-gold transition-colors duration-300"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LcUYuQqAAAAAIgPy8NX3iGIuXZXXriz-KM1YkHf"
                  onChange={handleCaptchaChange}
                  className="transform scale-90 sm:scale-100"
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${captchaVerified ? 'bg-primary hover:bg-primary-dark' : 'bg-gray-400 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold transition-all duration-300`}
                  disabled={!captchaVerified}
                >
                  Se connecter
                </button>
              </div>
            </form>
          ) : (
            // Formulaire de mot de passe oublié
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold"
                  placeholder="votre@email.com"
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold transition-all duration-300"
                >
                  <EnvelopeIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  Envoyer le lien de réinitialisation
                </button>
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-sm text-primary hover:text-gold transition-colors duration-300"
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
          )}
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Vous n'avez pas de compte ?{' '}
              <Link to="/register" className="font-medium text-primary hover:text-gold transition-colors">
                Inscrivez-vous
              </Link>
            </p>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-xs text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Besoin d'aide ?
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Connexion sécurisée
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;