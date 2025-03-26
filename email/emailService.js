const nodemailer = require('nodemailer');
const path = require('path')
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
            from: `"booking4u.in" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
            attachments: [
                {
                    filename: 'email-banner.jpg',
                    path: path.join(__dirname, '../templates/email-banner.jpg'),
                    cid: 'emailBanner' // Content ID for inline image
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Failed to send email: ${error.message}`);
    }
};
