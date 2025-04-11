const sequelize = require('../config/database');

async function addPasswordResetColumns() {
  try {
    // Add resetPasswordToken column
    await sequelize.query(`
      ALTER TABLE Users 
      ADD COLUMN resetPasswordToken VARCHAR(255) NULL
    `);
    
    // Add resetPasswordExpires column
    await sequelize.query(`
      ALTER TABLE Users 
      ADD COLUMN resetPasswordExpires DATETIME NULL
    `);
    
    console.log('Password reset columns added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding password reset columns:', error);
    process.exit(1);
  }
}

addPasswordResetColumns();