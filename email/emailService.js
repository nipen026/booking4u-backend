const nodemailer = require('nodemailer');

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send Email Function
exports.sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"Box Cricket Booking" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Failed to send email: ${error.message}`);
    }
};
