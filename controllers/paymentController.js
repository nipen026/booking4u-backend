const Razorpay = require('razorpay');
const Booking = require('../models/Booking'); // Import Booking model
require('dotenv').config();
const nodemailer = require('nodemailer');
const Box = require('../models/Box');
const Slot = require('../models/Slot');
const moment = require('moment');
const path = require('path');
const fs = require('fs')
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
});

exports.createOrder = async (req, res) => {
    const { bookingId, amount, name, email, phone, paymentMethod, currency = "INR" } = req.body;

    try {
        // Validate Booking ID
        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
            return res.status(404).json({ status: false, message: "❌ Booking not found" });
        }

        // Update Booking Table with Name, Email, and Phone before payment
        await Booking.update(
            { name, email, phone, price: amount, payment: paymentMethod }, // Update these fields
            { where: { id: bookingId } }
        );

        // Check Payment Method
        if (paymentMethod === "prepaid") {
            // Create Razorpay Order
            const order = await razorpay.orders.create({
                amount: amount * 100, // Convert to paise
                currency,
                receipt: `receipt_${Date.now()}`
            });

            return res.json({ status: true, data: order });
        } else {
            // If payment is not prepaid, directly confirm the booking
            await Booking.update(
                { status: "Confirmed" }, // Mark booking as confirmed
                { where: { id: bookingId } }
            );
            const updatedBooking = await Booking.findByPk(bookingId);

            // Send invoice email
            await sendInvoiceEmail(updatedBooking);

            return res.json({ status: true, message: "✅ Booking confirmed without online payment." });
        }

    } catch (error) {
        console.error("❌ Error processing booking:", error);
        res.status(500).json({ status: false, error: "Booking processing failed" });
    }
};

// Handle Payment Success & Update Booking Status
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your email app password
    }
});

// Function to send an invoice email using your template
const sendInvoiceEmail = async (booking) => {
    try {
        // Fetch related box and slot details
        const box = await Box.findByPk(booking.boxId);
        const slot = await Slot.findByPk(booking.slotId);

        // Format Date & Time
        const formattedDate = slot ? moment(slot.date).format('DD MMM YYYY') : 'N/A';
        const formattedStartTime = slot ? moment(slot.startTime, 'HH:mm:ss').format('hh:mm A') : 'N/A';
        const formattedEndTime = slot ? moment(slot.endTime, 'HH:mm:ss').format('hh:mm A') : 'N/A';

        // Read Email Template
        const templatePath = path.join(__dirname, '../templates/bookingConfirmation.html');
        let emailTemplate = fs.readFileSync(templatePath, 'utf8');

        // Replace Placeholders with Dynamic Values
        emailTemplate = emailTemplate
            .replace('{{NAME}}', booking.name)
            .replace('{{BOOKING_ID}}', booking.id)
            .replace('{{BOX_NAME}}', box ? box.name : 'N/A')
            .replace('{{DATE}}', formattedDate)
            .replace('{{START_TIME}}', formattedStartTime)
            .replace('{{END_TIME}}', formattedEndTime)
            .replace('{{PRICE}}', booking.price)
            .replace('{{PAYMENT_METHOD}}', booking.payment);

        // Email Configuration
        const mailOptions = {
            from: `"booking4u.in" <${process.env.EMAIL_USER}>`,
            to: booking.email, // Send to the user's email
            subject: '🥎 Booking Confirmation - booking4u.in',
            html: emailTemplate,
            attachments: [
                {
                    filename: 'email-banner.jpg',
                    path: path.join(__dirname, '../templates/email-banner.jpg'),
                    cid: 'emailBanner' // Content ID for inline image
                }
            ]
        };

        // Send Email
        await transporter.sendMail(mailOptions);
        console.log('✅ Booking confirmation email sent to:', booking.email);
    } catch (error) {
        console.error('❌ Error sending booking confirmation email:', error);
    }
};

// Handle Payment Success & Update Booking Status
exports.verifyPayment = async (req, res) => {
    const { bookingId, paymentId } = req.body;

    try {
        // Validate Booking ID
        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
            return res.status(404).json({ status: false, message: "❌ Booking not found" });
        }

        // Update Booking Status to Confirmed
        await Booking.update(
            { status: "Confirmed", paymentId }, // Store payment ID
            { where: { id: bookingId } }
        );

        // Fetch updated booking details
        const updatedBooking = await Booking.findByPk(bookingId);

        // Send invoice email
        await sendInvoiceEmail(updatedBooking);

        res.json({ status: true, message: "✅ Payment successful. Booking confirmed. Invoice sent to email." });

    } catch (error) {
        console.error("❌ Payment verification failed:", error);
        res.status(500).json({ status: false, error: "Payment verification failed" });
    }
};



// const axios = require('axios');
// require('dotenv').config();
// const crypto = require('crypto');

// const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
// const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
// const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX;
// const PHONEPE_API_URL = process.env.PHONEPE_API_URL; // Example: "https://api.phonepe.com/apis/hermes"

// exports.createOrder = async (req, res) => {
//     const { amount, currency = "INR" } = req.body;

//     try {
//         const totalAmount = (amount + 10) * 100; // Convert to paise and add ₹10 extra

//         const requestPayload = {
//             merchantId: PHONEPE_MERCHANT_ID,
//             merchantTransactionId: `TXN_${Date.now()}`,
//             amount: totalAmount,
//             currency,
//             redirectUrl: "https://yourwebsite.com/payment-success",
//             callbackUrl: "https://yourserver.com/payment-callback",
//             paymentInstrument: {
//                 type: "UPI_INTENT"
//             }
//         };

//         // Generate SHA256 hash for secure request
//         const payloadString = JSON.stringify(requestPayload);
//         const hash = crypto.createHash('sha256')
//             .update(payloadString + PHONEPE_SALT_KEY)
//             .digest('hex');
//         const xVerify = `${hash}###${PHONEPE_SALT_INDEX}`;

//         // Send request to PhonePe API
//         const response = await axios.post(`${PHONEPE_API_URL}/pg/v1/pay`, requestPayload, {
//             headers: {
//                 "Content-Type": "application/json",
//                 "X-VERIFY": xVerify
//             }
//         });

//         // Handle PhonePe response
//         if (response.data.success) {
//             res.json({
//                 status: "success",
//                 orderId: requestPayload.merchantTransactionId,
//                 paymentUrl: response.data.data.instrumentResponse.redirectInfo.url
//             });
//         } else {
//             throw new Error("PhonePe payment initiation failed");
//         }
//     } catch (error) {
//         console.error("❌ PhonePe order creation failed:", error);
//         res.status(500).json({ error: 'PhonePe order creation failed' });
//     }
// };
