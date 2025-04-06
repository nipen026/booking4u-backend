const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const moment = require('moment');
const Booking = require('../models/Booking');
const Box = require('../models/Box');
const Slot = require('../models/Slot');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const Turf = require('../models/Turf');

// exports.exportBookingData = async (req, res) => {
//     try {
//         const { startDate, endDate } = req.body;
//         const userId = req.user.id;
//         const userRole = req.user.role;

//         if (userRole !== 'admin') {
//             return res.status(403).json({ status: false, message: 'Access denied. Only Admins can export data.' });
//         }

//         if (!startDate || !endDate) {
//             return res.status(400).json({ status: false, message: 'Please provide startDate and endDate' });
//         }

//         // Fetch all boxes for this admin
//         const boxes = await Box.findAll({
//             where: { userId },
//             attributes: ['id', 'name', 'slots']
//         });

//         if (!boxes.length) {
//             return res.status(404).json({ status: false, message: 'No boxes found for this Admin' });
//         }

//         // Get all slots from all boxes (Flattening and removing duplicates)
//         const allSlots = [...new Set(boxes.flatMap(box => box.slots))].sort((a, b) =>
//             moment(a, 'hh:mm A').diff(moment(b, 'hh:mm A'))
//         );

//         // Get all dates within the range
//         const dates = [];
//         let currentDate = moment(startDate);
//         const endMoment = moment(endDate);
//         while (currentDate <= endMoment) {
//             dates.push(currentDate.format('YYYY-MM-DD'));
//             currentDate.add(1, 'day');
//         }

//         // Fetch confirmed bookings in the date range
//         const bookings = await Booking.findAll({
//             where: {
//                 boxId: boxes.map(box => box.id),
//                 createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] },
//                 status: 'Confirmed' // Fetch only confirmed bookings
//             },
//             include: [{ model: Slot, attributes: ['startTime', 'endTime', 'date'] }]
//         });

//         // Initialize payment counters & totals
//         let cashPaymentCount = 0, prepaidPaymentCount = 0;
//         let cashPaymentTotal = 0, prepaidPaymentTotal = 0;

//         // Transform booking data
//         const bookingData = bookings.map(booking => {
//             const formattedPaymentMethod = booking.payment?.toLowerCase();
//             const price = parseFloat(booking.price) || 0;

//             // Count payments separately & add to totals
//             if (formattedPaymentMethod === 'cash') {
//                 cashPaymentCount++;
//                 cashPaymentTotal += price;
//             } else if (formattedPaymentMethod === 'prepaid') {
//                 prepaidPaymentCount++;
//                 prepaidPaymentTotal += price;
//             }

//             return {
//                 slot: moment(booking.Slot.startTime, 'HH:mm:ss').format('hh:mm A'),
//                 startTime: moment(booking.Slot.startTime, 'HH:mm:ss').format('hh:mm A'),
//                 endTime: moment(booking.Slot.endTime, 'HH:mm:ss').format('hh:mm A'),
//                 date: moment(booking.Slot.date).format('YYYY-MM-DD'),
//                 name: booking.name,
//                 phone: booking.phone,
//                 email: booking.email,
//                 price: price,
//                 status: booking.status,
//                 paymentMethod: booking.payment,
//                 boxName: boxes.find(box => box.id === booking.boxId)?.name || "Unknown Box"
//             };
//         });

//         // Extract box names
//         const boxDetails = boxes.map(box => ({ name: box.name }));

//         return res.json({
//             status: true,
//             allSlots,
//             dates,
//             boxDetails,
//             bookingData,
//             cashPayment: {
//                 count: cashPaymentCount,
//                 totalAmount: cashPaymentTotal
//             },
//             prepaidPayment: {
//                 count: prepaidPaymentCount,
//                 totalAmount: prepaidPaymentTotal
//             }
//         });

//     } catch (error) {
//         console.error('❌ Error exporting data:', error);
//         res.status(500).json({ status: false, error: error.message });
//     }
// };

exports.exportBookingData = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole !== 'admin') {
            return res.status(403).json({ status: false, message: 'Access denied. Only Admins can export data.' });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ status: false, message: 'Please provide startDate and endDate' });
        }

        // Fetch all boxes for this admin
        const boxes = await Box.findAll({
            where: { userId },
            attributes: ['id', 'name']
        });

        if (!boxes.length) {
            return res.status(404).json({ status: false, message: 'No boxes found for this Admin' });
        }

        // Fetch turfs for each box
        const boxIds = boxes.map(box => box.id);
        const turfs = await Turf.findAll({
            where: { boxId: boxIds },
            attributes: ['id', 'boxId', 'turfname', 'turfSlots']
        });

        const turfMap = {};
        turfs.forEach(turf => {
            turfMap[turf.id] = turf;
        });

        // Flatten and deduplicate all turf slots
        const allSlots = [...new Set(turfs.flatMap(turf => turf.turfSlots))].sort((a, b) =>
            moment(a, 'hh:mm A').diff(moment(b, 'hh:mm A'))
        );

        // Generate all dates in the range
        const dates = [];
        let currentDate = moment(startDate);
        const endMoment = moment(endDate);
        while (currentDate <= endMoment) {
            dates.push(currentDate.format('YYYY-MM-DD'));
            currentDate.add(1, 'day');
        }   

        // Fetch bookings within date range
        const bookings = await Booking.findAll({
            where: {
                boxId: boxIds,
                createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] },
                status: 'Confirmed'
            },
            include: [{ model: Slot, attributes: ['startTime', 'endTime', 'date', 'turfId'] }]
        });

        // Payment data tracking
        let cashPaymentCount = 0, prepaidPaymentCount = 0;
        let cashPaymentTotal = 0, prepaidPaymentTotal = 0;

        // Prepare booking data
        const bookingData = bookings.map(booking => {
            const formattedPayment = booking.payment?.toLowerCase();
            const price = parseFloat(booking.price) || 0;

            if (formattedPayment === 'cash') {
                cashPaymentCount++;
                cashPaymentTotal += price;
            } else if (formattedPayment === 'prepaid') {
                prepaidPaymentCount++;
                prepaidPaymentTotal += price;
            }

            const slot = booking.Slot || {};
            const turf = turfMap[slot.turfId];

            return {
                slot: moment(slot.startTime, 'HH:mm:ss').format('hh:mm A'),
                startTime: moment(slot.startTime, 'HH:mm:ss').format('hh:mm A'),
                endTime: moment(slot.endTime, 'HH:mm:ss').format('hh:mm A'),
                date: moment(slot.date).format('YYYY-MM-DD'),
                name: booking.name,
                phone: booking.phone,
                email: booking.email,
                price,
                status: booking.status,
                paymentMethod: booking.payment,
                boxName: boxes.find(box => box.id === booking.boxId)?.name ,
                boxId: boxes.find(box => box.id === booking.boxId)?.id,
                turfName: turf?.turfname,
                turfId: turf?.id 
            };
        });

        const boxDetails = boxes.map(box => ({ name: box.name , id : box.id }));

        return res.json({
            status: true,
            allSlots,
            dates,
            boxDetails,
            turfs,
            bookingData,
            cashPayment: {
                count: cashPaymentCount,
                totalAmount: cashPaymentTotal
            },
            prepaidPayment: {
                count: prepaidPaymentCount,
                totalAmount: prepaidPaymentTotal
            }
        });

    } catch (error) {
        console.error('❌ Error exporting data:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};


exports.exportPaymentData = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole !== 'admin') {
            return res.status(403).json({ status: false, message: 'Access denied. Only Admins can access payment data.' });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ status: false, message: 'Please provide startDate and endDate' });
        }

        // Fetch all boxes for this admin
        const boxes = await Box.findAll({
            where: { userId },
            attributes: ['id', 'name', 'slots']
        });

        if (!boxes.length) {
            return res.status(404).json({ status: false, message: 'No boxes found for this Admin' });
        }

        // Get all slots from all boxes (Flatten and sort)
        const allSlots = [...new Set(boxes.flatMap(box => box.slots))].sort((a, b) =>
            moment(a, 'hh:mm A').diff(moment(b, 'hh:mm A'))
        );

        // Get all dates within the range
        const dates = [];
        let currentDate = moment(startDate);
        const endMoment = moment(endDate);
        while (currentDate <= endMoment) {
            dates.push(currentDate.format('YYYY-MM-DD'));
            currentDate.add(1, 'day');
        }

        // Get all box IDs
        const boxIds = boxes.map(box => box.id);

        // Fetch confirmed bookings with payment details
        const payments = await Booking.findAll({
            where: {
                boxId: boxIds,
                createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] },
                status: 'Confirmed' // Fetch only confirmed bookings
            },
            include: [
                { model: User, attributes: ['firstName', 'lastName', 'phone', 'email'] },
                { model: Box, attributes: ['name'] },
                { model: Slot, attributes: ['startTime', 'endTime', 'date'] }
            ]
        });

        // Transform payment data into required format
        const bookingData = payments.map(payment => ({
            slot: moment(payment.Slot.startTime, 'HH:mm:ss').format('hh:mm A'),
            startTime: moment(payment.Slot.startTime, 'HH:mm:ss').format('hh:mm A'),
            endTime: moment(payment.Slot.endTime, 'HH:mm:ss').format('hh:mm A'),
            date: moment(payment.Slot.date).format('YYYY-MM-DD'),
            name: `${payment.User.firstName} ${payment.User.lastName}`,
            phone: payment.User.phone,
            email: payment.User.email,
            price: payment.price,
            status: payment.status,
            paymentMethod: payment.payment, // ✅ Added payment method
            boxName: payment.Box.name || "Unknown Box"
        }));

        // Extract box details
        const boxDetails = boxes.map(box => ({ name: box.name }));

        return res.json({
            status: true,
            allSlots,   // ✅ Added all slots
            dates,      // ✅ Added all dates
            boxDetails, // ✅ Added all box names
            bookingData // ✅ Added payment method in payment data
        });

    } catch (error) {
        console.error('❌ Error fetching payment data:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};

