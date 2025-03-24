require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Database connection and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Changed from force: true to alter: true to preserve data
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer();