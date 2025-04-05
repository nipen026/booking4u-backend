const { v4: uuidv4 } = require('uuid');
const Turf = require('../models/Turf');
const Box = require('../models/Box');

// ➤ Add Turf
exports.addTurf = async (req, res) => {
    try {
        const turfs = req.body; // Expect an array directly
        const userId = req.user.id;

        if (!Array.isArray(turfs) || turfs.length === 0) {
            return res.status(400).json({ status: false, message: '❌ Invalid turfs data' });
        }

        const turfData = turfs.map(turf => ({
            turfname: turf.turfname,
            turfSlots: Array.isArray(turf.turfSlots)
                ? turf.turfSlots
                : typeof turf.turfSlots === 'string'
                    ? JSON.parse(turf.turfSlots || '[]')
                    : [],
            boxId: turf.boxId,
            userId
        }));

        const createdTurfs = await Turf.bulkCreate(turfData);

        res.status(201).json({
            status: true,
            message: '✅ Turfs added successfully',
            createdTurfs
        });

    } catch (error) {
        console.error('❌ Error adding turfs:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};



// ➤ Get All Turfs
exports.getAllTurfs = async (req, res) => {
    try {
        const turfs = await Turf.findAll();
        res.status(200).json({ status: true, turfs });
    } catch (error) {
        console.error('❌ Error fetching turfs:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};

// ➤ Get Turf by ID
exports.getTurfById = async (req, res) => {
    try {
        const { id } = req.params;
        const turf = await Turf.findByPk(id);
        if (!turf) {
            return res.status(404).json({ status: false, message: '❌ Turf not found' });
        }
        res.status(200).json({ status: true, turf });
    } catch (error) {
        console.error('❌ Error fetching turf:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};

// ➤ Update Turf
exports.updateTurf = async (req, res) => {
    try {
        const { id } = req.params;
        const { tuftSlots } = req.body;

        // Parse tuftSlots (if sent as a string)
        const parsedTuftSlots = Array.isArray(tuftSlots) ? tuftSlots : JSON.parse(tuftSlots || '[]');

        const turf = await Turf.findByPk(id);
        if (!turf) {
            return res.status(404).json({ status: false, message: '❌ Turf not found' });
        }

        await turf.update({ tuftSlots: parsedTuftSlots });
        res.status(200).json({ status: true, message: '✅ Turf updated successfully', turf });
    } catch (error) {
        console.error('❌ Error updating turf:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};

// ➤ Delete Turf
exports.deleteTurf = async (req, res) => {
    try {
        const { id } = req.params;
        const turf = await Turf.findByPk(id);
        if (!turf) {
            return res.status(404).json({ status: false, message: '❌ Turf not found' });
        }

        await turf.destroy();
        res.status(200).json({ status: true, message: '✅ Turf deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting turf:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};
