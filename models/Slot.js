const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Turf = require('./Turf');

const Slot = sequelize.define('Slot', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    boxId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    turfId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Turfs',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    firstname: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: true
    },
    price: { 
        type: DataTypes.FLOAT, 
        allowNull: true 
    },
    advancepayment: { 
        type: DataTypes.FLOAT, 
        allowNull: true 
    },
    payment: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'cash'
    },
    bookername: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('available', 'Admin booked', 'Cancelled'),
        defaultValue: 'Admin booked'
    }
});

module.exports = Slot;

Slot.belongsTo(Turf, { foreignKey: 'turfId' });