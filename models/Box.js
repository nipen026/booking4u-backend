const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Box = sequelize.define('Box', {
    name: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    pricePerHour: { type: DataTypes.FLOAT, allowNull: false },
    discountPrice: { type: DataTypes.FLOAT, allowNull: true }, // New Field
    details: { type: DataTypes.TEXT, allowNull: false },
    facilities: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
    slots: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
    images: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    googleMapLink: { type: DataTypes.TEXT, allowNull: true }, // Changed to TEXT
    landmark: { type: DataTypes.STRING, allowNull: true },   
    state: { type: DataTypes.STRING, allowNull: true },      
    city: { type: DataTypes.STRING, allowNull: true },       
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',  // Reference to the Users table
            key: 'id'
        }
    }
});

module.exports = Box;
