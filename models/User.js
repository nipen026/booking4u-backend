const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    email: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
    },
    username: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    password: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    dob: { 
        type: DataTypes.DATEONLY, 
        allowNull: true 
    },
    role: { 
        type: DataTypes.ENUM('superuser', 'admin', 'user'), 
        defaultValue: 'user' 
    },
    firstName: { 
        type: DataTypes.STRING, 
        allowNull: true 
    },
    lastName: { 
        type: DataTypes.STRING, 
        allowNull: true 
    },
    phone: { 
        type: DataTypes.STRING, 
        allowNull: true 
    },
    country: { 
        type: DataTypes.STRING, 
        allowNull: true 
    },
    state: { 
        type: DataTypes.STRING, 
        allowNull: true 
    }
});

module.exports = User;
