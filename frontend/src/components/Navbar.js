import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-primary to-secondary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-gold font-bold flex items-center">
                <img 
                  src="logo.png" 
                  alt="Planning-Corporate" 
                  className="h-20 mr-3" 
                />
              </Link>
            </div>
          </div>
          
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <Link to="/" className="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative group">
              Accueil
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {user ? (
              <>
                {user.role === 'administrateur' && (
                  <Link to="/dashboard" className="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative group">
                    Tableau de bord
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                  </Link>
                )}
                <Link to="/calendar" className="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative group">
                  Calendrier
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link to="/profile" className="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative group">
                  Profil
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                </Link>
                {user.role === 'administrateur' && (
                  <>
                    <Link to="/users" className="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative group">
                      Utilisateurs
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                    </Link>
                    <Link to="/locked-users" className="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative group">
                      Utilisateurs bloqués
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                    </Link>
                  </>
                )}
                <button
                  onClick={logout}
                  className="text-white bg-red-700 hover:bg-red-800 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative group">
                  Connexion
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link to="/register" className="text-gold bg-navy hover:bg-navy/80 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300">
                  Inscription
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gold hover:bg-primary-700 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Accueil
            </Link>
            
            {user ? (
              <>
                {user.role === 'administrateur' && (
                  <Link 
                    to="/dashboard" 
                    className="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Tableau de bord
                  </Link>
                )}
                <Link 
                  to="/calendar" 
                  className="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Calendrier
                </Link>
                <Link 
                  to="/profile" 
                  className="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profil
                </Link>
                {user.role === 'administrateur' && (
                  <>
                    <Link 
                      to="/users" 
                      className="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Utilisateurs
                    </Link>
                    <Link 
                      to="/locked-users" 
                      className="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Utilisateurs bloqués
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="text-white bg-red-700 hover:bg-red-800 w-full text-left px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link 
                  to="/register" 
                  className="text-gold bg-navy hover:bg-navy/80 block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;