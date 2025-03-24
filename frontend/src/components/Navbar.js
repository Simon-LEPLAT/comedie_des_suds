import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-white text-2xl font-bold">
                Comédie des Suds
              </Link>
            </div>
          </div>
          
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <Link to="/" className="nav-link">
              Accueil
            </Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">
                  Tableau de bord
                </Link>
                <Link to="/profile" className="text-gray-300 hover:bg-primary-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Profil
                </Link>
                {user.role === 'administrateur' && (
                  <>
                    <Link to="/users" className="text-gray-300 hover:bg-primary-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Utilisateurs
                    </Link>
                    <Link to="/users/locked" className="text-gray-300 hover:bg-primary-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Utilisateurs bloqués
                    </Link>
                  </>
                )}
                <button
                  onClick={logout}
                  className="text-gray-300 hover:bg-primary-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Connexion
                </Link>
                <Link to="/register" className="nav-link">
                  Inscription
                </Link>
              </>
            )}
          </div>
          
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/"
            className="text-gray-300 hover:bg-primary-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Accueil
          </Link>
          
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-gray-300 hover:bg-primary-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Tableau de bord
              </Link>
              <Link
                to="/profile"
                className="text-gray-300 hover:bg-primary-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Profil
              </Link>
              {user.role === 'administrateur' && (
                <>
                  <Link to="/users" className="text-gray-300 hover:bg-primary-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Utilisateurs
                  </Link>
                  <Link to="/users/locked" className="text-gray-300 hover:bg-primary-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Utilisateurs bloqués
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="text-gray-300 hover:bg-primary-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-300 hover:bg-primary-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="text-gray-300 hover:bg-primary-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;