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
        force:true
    }
);

sequelize.authenticate()
    .then(() => console.log('✅ Database connected successfully'))
    .catch(err => console.error('❌ Database connection error:', err));

// 🔹 Sync models and auto-create new fields
sequelize.sync({ force: false }) // Set to true only if you want to reset the DB
    .then(() => console.log('✅ Database synced successfully with updated fields'))
    .catch(err => console.error('❌ Sync error:', err));
