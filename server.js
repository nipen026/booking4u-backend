const express = require('express');
require('dotenv').config();
const sequelize = require('./config/db');
const boxRoutes = require('./routes/box');
const slotRoutes = require('./routes/slot');
const bookingRoutes = require('./routes/booking');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const offerRoutes = require('./routes/offer');
const paymentRoutes = require('./routes/payment');
const contactRoutes = require('./routes/contact');
const cors = require('cors')

const app = express();
app.use(cors())
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded images
app.use('/api/box', boxRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/api/user',userRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/payment',paymentRoutes);
app.use('/api/contact',contactRoutes);
// Database Sync and Server Start
sequelize.sync({ force: false }).then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
