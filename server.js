const fs = require('fs');
const https = require('https');
const http = require('http');
const express = require('express');
require('dotenv').config();
const sequelize = require('./config/db');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

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
const turfRoutes = require('./routes/turf');

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
app.use('/api/turf', turfRoutes);

// Determine Environment (Local or Production)
const PORT_HTTP = 8080; // HTTP Port for Localhost
const PORT_HTTPS = 443; // HTTPS Port for Production

sequelize.sync({ force: false,alter:true }).then(() => {
    if (process.env.NODE_ENV === 'production') {
        // ✅ Load SSL Certificates for Production
        const sslOptions = {
            key: fs.readFileSync('/etc/letsencrypt/live/api.booking4u.in/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/api.booking4u.in/cert.pem'),
            ca: fs.readFileSync('/etc/letsencrypt/live/api.booking4u.in/fullchain.pem')
        };

        https.createServer(sslOptions, app).listen(PORT_HTTPS, () => {
            console.log(`✅ Server running securely on HTTPS (port ${PORT_HTTPS})`);
        });

        // Redirect HTTP to HTTPS
        http.createServer((req, res) => {
            res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
            res.end();
        }).listen(80, () => {
            console.log('🔄 Redirecting HTTP to HTTPS');
        });

    } else {
        // ✅ Run Local Development Server on HTTP
        app.listen(PORT_HTTP, () => {
            console.log(`✅ Server running locally on HTTP (port ${PORT_HTTP})`);
        });
    }
});
