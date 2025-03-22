const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        port: parseInt(process.env.DB_PORT) || 5432,
        logging: false,  // Disable logging for cleaner output
    }
);

sequelize.authenticate()
    .then(() => console.log('✅ Database connected successfully'))
    .catch(err => console.error('❌ Database connection error:', err));

module.exports = sequelize;  // ✅ Ensure this is exported
