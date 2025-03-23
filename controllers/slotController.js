const { Op } = require('sequelize');  // Import Sequelize operators
const Slot = require('../models/Slot');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// ➕ Add Slot

exports.addSlot = async (req, res) => {
    const { boxId, startTime, endTime, date,firstname,lastname } = req.body;
    const userId = req.user.id; // Extract user ID from token

    try {
        // Fetch user details to get role and name
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: '❌ User not found' });
        }

        const role = user.role; // Extract role from User model

        // Generate a unique Slot ID    
        const slotId = `SLOT-${uuidv4().slice(0, 8).toUpperCase()}`;

        // Create a new slot in the database
        const newSlot = await Slot.create({
            id: slotId,
            boxId,
            userId,
            firstname, // Store first name
            lastname, // Store last name
            role,
            startTime,
            endTime,
            date
        });

        res.status(201).json({ message: '✅ Slot added successfully', newSlot });

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

        if (!slot) return res.status(200).json({ slot , message: '❌ Slot not found' });

        res.json(slot);
    } catch (error) {
        console.error('❌ Error fetching slot:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getSlotByBoxId = async (req, res) => {
    const { id, date } = req.params;  // Extract boxId and date from params

    try {
        const slot = await Slot.findAll({
            where: {
                boxId: id,
                date: date,
                status: { [Op.or]: ['available', 'Admin booked'] }  // Filter only available and booked slots
            },
        });

        if (!slot || slot.length === 0) return res.status(200).json({ slot ,message: '❌ Slot not found' });

        res.json({ status: true, slot });
    } catch (error) {
        console.error('❌ Error fetching slot:', error);
        res.status(500).json({ error: error.message });
    }
};



// ✏️ Update Slot
exports.updateSlot = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const userId = req.user.id; // Extract user ID from token
    const slotDemo = await Slot.findOne({ where: { id } }); 
    console.log(id,"slotdEMO");
    
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
