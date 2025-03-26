const Room = require('../models/roomModel');
const sequelize = require('../config/database');

const addRooms = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Define rooms to add
    const roomsToAdd = [
      {
        name: "Comédie d'Aix",
        capacity: 200,
        description: "Salle principale de la Comédie d'Aix"
      },
      {
        name: "Comédie des Suds",
        capacity: 250,
        description: "Salle principale de la Comédie des Suds"
      },
      {
        name: "Comédie de Marseille",
        capacity: 300,
        description: "Salle principale de la Comédie de Marseille"
      },
      {
        name: "Comédie Le Mans",
        capacity: 180,
        description: "Salle principale de la Comédie Le Mans"
      },
      {
        name: "Comédie La Rochelle",
        capacity: 220,
        description: "Salle principale de la Comédie La Rochelle"
      },
      {
        name: "La Fontaine d'Argent",
        capacity: 150,
        description: "Salle principale de La Fontaine d'Argent"
      }
    ];
    
    // Add rooms to database
    for (const roomData of roomsToAdd) {
      const [room, created] = await Room.findOrCreate({
        where: { name: roomData.name },
        defaults: roomData
      });
      
      if (created) {
        console.log(`Room "${roomData.name}" added successfully.`);
      } else {
        console.log(`Room "${roomData.name}" already exists.`);
      }
    }
    
    console.log('All rooms have been processed.');
    process.exit(0);
  } catch (error) {
    console.error('Error adding rooms:', error);
    process.exit(1);
  }
};

// Run the function
addRooms();