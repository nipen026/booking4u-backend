const Booking = require('../models/Booking');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Box = require('../models/Box');
const Slot = require('../models/Slot');
const { generateInvoice } = require('../invoice/invoiceService');
const { sendEmail } = require('../email/emailService');
const fs = require('fs');
const path = require('path');



exports.addBooking = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from token
        const { boxId, startTime, endTime, date } = req.body;

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
                { model: Slot, attributes: ['startTime', 'endTime','date'] }
            ]
        });

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
                { model: Slot, attributes: ['startTime', 'endTime', 'date'] }
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

        // Load and Replace Email Template
        const templatePath = path.join(__dirname, '../templates/bookingCancellation.html');
        const templateContent = fs.readFileSync(templatePath, 'utf8')
            .replace('{{name}}', booking.User.username)
            .replace('{{bookingId}}', booking.id);

        // Send Cancellation Email
        await sendEmail(booking.User.email, 'Booking Cancellation', templateContent);

        res.json({ message: '✅ Booking cancelled successfully. Slot status updated to Cancelled.' });

    } catch (error) {
        console.error("❌ Error cancelling booking:", error);
        res.status(500).json({ error: error.message });
    }
};

