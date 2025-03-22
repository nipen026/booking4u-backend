const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');
require('dotenv').config();
exports.submitContactForm = async (req, res) => {
    const { name, company,phone, message } = req.body;

    try {
        // Store contact form details in DB
        const contact = await Contact.create({ name, company,phone, message });

        // Email Content
        const subject = "New Contact Form Submission";
        const emailBody = `
            <h2>New Contact Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Contact:</strong> ${phone}</p>
            <p><strong>Message:</strong> ${message}</p>
        `;

        // Send notification to your email
        await sendEmail(process.env.EMAIL_USER, subject, emailBody);

        res.status(200).json({ status: true, message: "✅ Contact form submitted successfully" });
    } catch (error) {
        console.error('❌ Error submitting contact form:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};

const sendEmail = async (to, subject, html) => {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,  // Your email
                pass: process.env.EMAIL_PASS     // Your email password or App Password
            }
        });

        await transporter.sendMail({
            from: `"Contact Form" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });

        console.log("📧 Email sent successfully!");
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};

