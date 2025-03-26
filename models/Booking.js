const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Box = require('./Box');
const Slot = require('./Slot');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    boxId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Box, key: 'id' }
    },

    slotId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: Slot, key: 'id' }
    },   
    payment: { type: DataTypes.STRING, allowNull: true }, 
    name: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    price: { 
        type: DataTypes.FLOAT,  // ✅ Added Price Column
        allowNull: true 
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Confirmed', 'Cancelled'),
        defaultValue: 'Pending'
    }
});

// Define Relations
Booking.belongsTo(User, { foreignKey: 'userId' });
Booking.belongsTo(Box, { foreignKey: 'boxId' });
Booking.belongsTo(Slot, { foreignKey: 'slotId' });

module.exports = Booking;
