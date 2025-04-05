const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Box = require('./Box');

const Turf = sequelize.define('Turf', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    turfname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    boxId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Boxes',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    turfSlots: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    }
}, {
    tableName: 'Turfs',
    timestamps: true,
});

module.exports = Turf;