const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Offer = sequelize.define('Offer', {
    offer_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    box_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    days: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Active', 'Disable'),
        defaultValue: 'Active'
    },
    offer_price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    offer_percentage_discount: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'offers'
});

module.exports = Offer;
