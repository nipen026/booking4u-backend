const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Generate PDF Invoice
exports.generateInvoice = async (bookingData) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const invoicePath = path.join(__dirname, `../invoices/Invoice_${bookingData.id}.pdf`);

        doc.pipe(fs.createWriteStream(invoicePath));

        // Header
        doc.fontSize(20).text('Box Cricket Booking Invoice', { align: 'center' }).moveDown();

        // Booking Details
        doc.fontSize(14).text(`Booking ID: ${bookingData.id}`);
        doc.text(`Name: ${bookingData.name}`);
        doc.text(`Email: ${bookingData.email}`);
        doc.text(`Phone: ${bookingData.phone}`);
        doc.text(`Box Name: ${bookingData.boxName}`);
        doc.text(`Date: ${bookingData.date}`);
        doc.text(`Time: ${bookingData.startTime} - ${bookingData.endTime}`);
        doc.text(`Total Amount: ₹${bookingData.amount}`);

        // Footer
        doc.moveDown();
        doc.text('Thank you for choosing our services!', { align: 'center' });

        doc.end();

        resolve(invoicePath);
    });
};
