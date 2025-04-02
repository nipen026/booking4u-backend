const fs = require('fs');
const https = require('https');
const express = require('express');
require('dotenv').config();
const sequelize = require('./config/db');
const cors = require('cors');

// Import routes
const boxRoutes = require('./routes/box');
const slotRoutes = require('./routes/slot');
const bookingRoutes = require('./routes/booking');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const offerRoutes = require('./routes/offer');
const paymentRoutes = require('./routes/payment');
const contactRoutes = require('./routes/contact');
const sheetRoutes = require('./routes/sheet');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/box', boxRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/sheet', sheetRoutes);

// Load SSL Certificates
const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/api.booking4u.in/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/api.booking4u.in/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/api.booking4u.in/fullchain.pem')
};

// Sync Database and Start HTTPS Server
sequelize.sync({ force: false }).then(() => {
    https.createServer(sslOptions, app).listen(443, () => {
        console.log('Server running securely on HTTPS (port 443)');
    });
});

// Redirect HTTP to HTTPS
const http = require('http');
http.createServer((req, res) => {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80, () => {
    console.log('Redirecting HTTP to HTTPS');
});
