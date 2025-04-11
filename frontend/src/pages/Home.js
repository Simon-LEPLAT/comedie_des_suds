import React from 'react';

const Home = () => {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <img 
          src="/logo-noir.png" 
          alt="Planning-Corporate" 
          className="h-32"
        />
      </div>
      <p className="text-lg text-gray-600">Bienvenue sur notre plateforme de gestion des événements</p>
    </div>
  );
};

export default Home;