const Razorpay = require('razorpay');
const  Booking  = require('../models/Booking'); // Import Booking model
require('dotenv').config();
const nodemailer = require('nodemailer');
const Box = require('../models/Box');
const Slot = require('../models/Slot');

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
            { name, email, phone }, // Update these fields
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
    // Fetch related box and slot details
    const box = await Box.findByPk(booking.boxId);
    const slot = await Slot.findByPk(booking.slotId);

    const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Booking Confirmation</title>
    </head>
    <body>
        <h2>Booking Confirmed!</h2>
        <p>Dear ${booking.name},</p>
        <p>Thank you for booking with us. Here are your booking details:</p>

        <ul>
            <li><b>Booking ID:</b> ${booking.id}</li>
            <li><b>Box Name:</b> ${box ? box.name : 'N/A'}</li>
            <li><b>Date:</b> ${slot ? slot.date : 'N/A'}</li>
            <li><b>Time:</b> ${slot ? slot.startTime : 'N/A'} - ${slot ? slot.endTime : 'N/A'}</li>
        </ul>

        <p>We look forward to seeing you!</p>
    </body>
    </html>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.email, // Send to the user's email
        subject: '📜 Booking Confirmation - Box Cricket',
        html: emailTemplate
    };

    await transporter.sendMail(mailOptions);
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
