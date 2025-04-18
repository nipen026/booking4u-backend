const Booking = require('../models/Booking');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Box = require('../models/Box');
const Slot = require('../models/Slot');
const { generateInvoice } = require('../invoice/invoiceService');
const { sendEmail } = require('../email/emailService');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { Op } = require('sequelize');
const moment = require('moment');
const Turf = require('../models/Turf');



exports.addBooking = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from token
        const { boxId, startTime, endTime, date,turfId } = req.body;

        // Fetch user details to get role
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: '❌ User not found' });
        }

        const role = user.role; // Extract role

        // Check if Box exists
        const box = await Box.findByPk(boxId);
        if (!box) {
            return res.status(404).json({ status: false, message: '❌ Box not found' });
        }

        // Get amount from box price
        const amount = box.pricePerHour; // Adjust if price logic changes

        // Check if the slot exists, if not, create it
        let slot = await Slot.findOne({ where: { boxId, startTime, endTime, date } });

        if (!slot) {
            slot = await Slot.create({
                id: `SLOT-${uuidv4().slice(0, 8).toUpperCase()}`,
                boxId,
                turfId,
                userId, // Store user ID
                role,  // Store user role
                startTime,
                endTime,
                date
            });
        }

        // Generate a unique Booking ID
        const bookingId = `BOOKING-${uuidv4().slice(0, 8).toUpperCase()}`;

        // Create a new booking in the database without name, email, and phone
        const newBooking = await Booking.create({
            id: bookingId,
            userId,
            turfId,
            boxId,
            slotId: slot.id, // Link to dynamically created slot
            amount,
            status: 'Pending' // Default status
        });

        res.status(201).json({
            status:true,
            message: '✅ Booking added successfully',
            newBooking
        });

    } catch (error) {
        console.error('❌ Error adding booking:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};

const deleteExpiredBookings = async () => {
    try {
        // Find all bookings that are still pending and older than 30 minutes
        const expiredBookings = await Booking.findAll({
            where: {
                status: 'Pending',
                createdAt: {
                    [Op.lt]: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
                }
            }
        });

        for (const booking of expiredBookings) {
            // Delete the associated slot
            await Slot.destroy({ where: { id: booking.slotId } });

            // Delete the booking itself
            await Booking.destroy({ where: { id: booking.id } });

            console.log(`🗑️ Deleted expired booking: ${booking.id}`);
        }
    } catch (error) {
        console.error('❌ Error deleting expired bookings:', error);
    }
};


cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Running cron job to check for expired bookings...');
    await deleteExpiredBookings();
});

// 📋 Get All Bookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            include: [
                { model: User, attributes: ['username', 'email'] },
                { model: Box, attributes: ['name', 'location'] },
                { model: Slot, attributes: ['startTime', 'endTime'] }
            ]
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔎 Get Booking by ID
exports.getBookingById = async (req, res) => {
    const { id } = req.params;

    try {
        const booking = await Booking.findByPk(id, {
            include: [
                { model: User, attributes: ['username', 'email'] },
                { model: Box, attributes: ['name', 'location','pricePerHour'] },
                { model: Slot, attributes: ['startTime', 'endTime','date'] },
                { model: Turf, attributes: ['turfname'] }
            ]
        });

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllBookingsForAdmin = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from token (assuming JWT middleware)
        const userRole = req.user.role; // Extract user role (ensure role is stored in token)

        // Check if user is an Admin (box owner)
        if (userRole !== 'admin') {
            return res.status(403).json({ status: false, message: 'Access denied. Only Admins can view bookings.' });
        }

        // Find the box associated with the Admin (box owner)
        const box = await Box.findOne({ where: { userId } });
        if (!box) {
            return res.status(404).json({ status: false, message: 'No box found for this Admin' });
        }

        const { date } = req.query; // Optional date filter
        const whereClause = { boxId: box.id }; // Filter bookings by Box ID

        if (date) whereClause.date = date; // Apply date filter if provided

        // Fetch all bookings for the Admin's box
        const bookings = await Booking.findAll({
            where: whereClause,
            include: [
                { model: User, attributes: ['username', 'email','firstName','lastName','phone'] },
                { model: Box, attributes: ['name', 'location', 'pricePerHour'] },
                { model: Slot, attributes: ['startTime', 'endTime', 'date'] },
                { model: Turf, attributes: ['turfname'] }
            ]
        });

        if (!bookings || bookings.length === 0) {
            return res.status(200).json({ status: false, message: 'No bookings found for your box',bookings });
        }

        res.json({ status: true, bookings });
    } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getConfirmedBookings = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from token

        const bookings = await Booking.findAll({
            where: { userId, status: 'Confirmed' }, // Filter by user ID from token and status Confirmed
            include: [
                { model: User, attributes: ['username', 'email'] },
                { model: Box, attributes: ['name', 'location', 'pricePerHour'] },
                { model: Slot, attributes: ['startTime', 'endTime', 'date'] },
                { model: Turf, attributes: ['turfname'] }
            ]
        });

        if (!bookings.length) {
            return res.status(200).json({ message: '❌ No confirmed bookings found for this user',bookings });
        }

        res.json({ status: true, bookings });
    } catch (error) {
        console.error('❌ Error fetching confirmed bookings:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};


// ✏️ Update Booking
exports.updateBooking = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const booking = await Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        await booking.update(updatedData);
        res.json({ message: 'Booking updated successfully', booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ❌ Delete Booking
exports.cancelBooking = async (req, res) => {
    const { id } = req.body;

    try {
        // Find Booking with User, Box, and Slot Details
        const booking = await Booking.findOne({
            where: { id },
            include: [
                { model: User, attributes: ['username', 'email'] },
                { model: Box, attributes: ['name', 'location', 'pricePerHour'] },
                { model: Slot, attributes: ['id', 'startTime', 'endTime', 'date', 'status'] }
            ]
        });

        if (!booking) return res.status(404).json({ message: '❌ Booking not found' });

        // Update Slot Status to "Cancelled"
        if (booking.Slot) {
            const slot = await Slot.findOne({ where: { id: booking.slotId } });
            await slot.update({ status: 'Cancelled' });
        }

        // Update Booking Status to "Cancelled"
        await booking.update({ status: 'Cancelled' });
   // Format Date & Time
        const formattedDate = booking.Slot ? moment(booking.Slot.date).format('DD MMM YYYY') : 'N/A';
        const formattedStartTime = booking.Slot ? moment(booking.Slot.startTime, 'HH:mm:ss').format('hh:mm A') : 'N/A';
        const formattedEndTime = booking.Slot ? moment(booking.Slot.endTime, 'HH:mm:ss').format('hh:mm A') : 'N/A';
        // Load and Replace Email Template
        const templatePath = path.join(__dirname, '../templates/bookingCancellation.html');
        const templateContent = fs.readFileSync(templatePath, 'utf8')
            .replace('{{NAME}}', booking.name)
            .replace('{{BOOKING_ID}}', booking.id)
            .replace('{{BOX_NAME}}', booking.Box.name ? booking.Box.name : 'N/A')
            .replace('{{DATE}}', formattedDate)
            .replace('{{START_TIME}}', formattedStartTime)
            .replace('{{END_TIME}}', formattedEndTime)
            .replace('{{PRICE}}', booking.price)
            .replace('{{PAYMENT_METHOD}}', booking.payment);

        // Send Cancellation Email
        await sendEmail(booking.User.email, 'Booking Cancellation', templateContent);

        res.json({ message: '✅ Booking cancelled successfully. Slot status updated to Cancelled.' });

    } catch (error) {
        console.error("❌ Error cancelling booking:", error);
        res.status(500).json({ error: error.message });
    }
};

