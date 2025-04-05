const { Op } = require('sequelize');  // Import Sequelize operators
const Slot = require('../models/Slot');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Box = require('../models/Box');
const { v4: uuidv4 } = require('uuid');
const Turf = require('../models/Turf');
const dayjs = require('dayjs')

// ➕ Add Slot
exports.addSlot = async (req, res) => {
    const {
        boxId,
        turfId,
        startTime,
        endTime,
        date,
        firstname,
        lastname,
        price,
        payment,
        type,
        bookername,
        advancepayment
    } = req.body;

    const userId = req.user.id;

    try {
        // ✅ Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: '❌ User not found' });
        }

        const role = user.role;
        const slotId = `SLOT-${uuidv4().slice(0, 8).toUpperCase()}`;

        // ✅ Ensure Turf exists and belongs to the given Box
        // const turf = await Turf.findOne({ where: { id: turfId, boxId } });
        // if (!turf) {
        //     return res.status(400).json({ status: false, message: '❌ Turf not found or not under the given box' });
        // }

        // ✅ Create new Slot
        const newSlot = await Slot.create({
            id: slotId,
            boxId,
            turfId,
            userId,
            firstname,
            lastname,
            bookername,
            role,
            advancepayment,
            startTime,
            endTime,
            date,
            price,
            payment
        });

        // ✅ Manual booking case
        if (type === "manual") {
            const bookingId = `BOOKING-${uuidv4().slice(0, 8).toUpperCase()}`;

            const box = await Box.findByPk(boxId);
            if (!box) {
                return res.status(404).json({ status: false, message: '❌ Box not found' });
            }

            const newBooking = await Booking.create({
                id: bookingId,
                userId,
                boxId,
                turfId,
                slotId: newSlot.id,
                name: `${firstname} ${lastname}`,
                price,
                payment,
                status: 'Confirmed'
            });

            return res.status(201).json({
                status: true,
                message: '✅ Slot and Booking added successfully',
                newSlot,
                newBooking
            });
        }

        // ✅ Return response if no booking
        res.status(201).json({
            status: true,
            message: '✅ Slot added successfully',
            newSlot
        });

    } catch (error) {
        console.error('❌ Error adding slot:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};


// 📋 Get All Slots
exports.getAllSlots = async (req, res) => {
    try {
        const slots = await Slot.findAll();
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔎 Get Slot by ID
exports.getSlotById = async (req, res) => {
    const { id } = req.params;  // Extract boxId from params
    const userId = req.user.id;    // Extract userId from token

    try {
        const slot = await Slot.findAll({
            where: {
                boxId: id,
                userId: userId,
                status: { [Op.or]: ['available', 'Admin booked'] }  // Filter only available and booked slots
            },

        });

        if (!slot) return res.status(200).json({ slot, message: '❌ Slot not found' });

        res.json(slot);
    } catch (error) {
        console.error('❌ Error fetching slot:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getSlotByBoxId = async (req, res) => {
    const { id, date,turfId } = req.params;  // Extract boxId and date from params

    try {
        const slot = await Slot.findAll({
            where: {
                turfId: turfId,
                boxId: id,
                date: date,
                status: { [Op.or]: ['available', 'Admin booked'] }  // Filter only available and booked slots
            },
        });

        if (!slot || slot.length === 0) return res.status(200).json({ slot, message: '❌ Slot not found' });

        res.json({ status: true, slot });
    } catch (error) {
        console.error('❌ Error fetching slot:', error);
        res.status(500).json({ error: error.message });
    }
};

const generateHourlySlots = (start = 6, end = 23, date) => {
    const slots = [];
    for (let hour = start; hour < end; hour++) {
        const startTime = dayjs().hour(hour).minute(0).second(0).format('HH:mm:ss');
        const endTime = dayjs().hour(hour + 1).minute(0).second(0).format('HH:mm:ss');
        slots.push({ startTime, endTime, date });
    }
    return slots;
};



exports.getPendingSlotsByDate = async (req, res) => {
    const { id, date } = req.params;

    try {
        const turfs = await Turf.findAll({ where: { boxId: id } });

        if (!turfs || turfs.length === 0) {
            return res.status(404).json({ status: false, message: '❌ No turfs found under this box' });
        }

        const bookedSlots = await Slot.findAll({
            where: { boxId: id, date }
        });

        const pendingSlots = [];

        for (const turf of turfs) {
            let turfSlotList = Array.isArray(turf.turfSlots) ? [...turf.turfSlots] : [];

            // Convert turf slots to Dayjs objects for filtering
            const turfSlotTimes = turfSlotList.map(slot =>
                dayjs(slot, 'hh:mm A')
            );

            // Filter out booked slots
            const filteredSlots = turfSlotTimes.filter(turfSlotTime => {
                const isBooked = bookedSlots.some(booked => {
                    const bookedStart = dayjs(booked.startTime, 'HH:mm:ss');
                    const bookedEnd = dayjs(booked.endTime, 'HH:mm:ss');

                    // Remove slot if it's in the booked range
                    return (
                        turfSlotTime.isSame(bookedStart) ||
                        (turfSlotTime.isAfter(bookedStart) && turfSlotTime.isBefore(bookedEnd))
                    );
                });

                return !isBooked;
            });

            // Convert back to original string format
            const available = filteredSlots.map(t =>    t.format('hh:mm A'),);

            pendingSlots.push(...available);
        }

        if (pendingSlots.length === 0) {
            return res.status(200).json({ status: false, slots: [], message: '❌ No available slots for this date' });
        }

        res.json({ status: true, slots: pendingSlots });

    } catch (error) {
        console.error('❌ Error fetching pending slots:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};





// ✏️ Update Slot
exports.updateSlot = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const userId = req.user.id; // Extract user ID from token
    const slotDemo = await Slot.findOne({ where: { id } });
    console.log(id, "slotdEMO");

    try {
        const slot = await Slot.findOne({ where: { id } });  // ✅ Corrected to query the Slot model

        // Check if slot exists
        if (!slot) {
            return res.status(404).json({ status: false, message: '❌ Slot not found' });
        }

        // Check if the logged-in user is the slot's owner
        if (slot.userId !== userId) {
            return res.status(403).json({ status: false, message: '❌ Unauthorized: You can only update your own slots' });
        }

        // Update slot data
        await slot.update(updatedData);

        res.json({ status: true, message: '✅ Slot updated successfully', slot });
    } catch (error) {
        console.error('❌ Error updating slot:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};




// ❌ Delete Slot
exports.deleteSlot = async (req, res) => {
    const { id } = req.params;

    try {
        const slot = await Slot.findByPk(id);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });

        await slot.destroy();
        res.json({ message: 'Slot deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
