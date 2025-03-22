const { Op } = require('sequelize');  // Import Sequelize operators
const Box = require('../models/Box');

// ➕ Add Box
exports.addBox = async (req, res) => {
    const {
        name,
        location,
        pricePerHour,
        discountPrice,
        details,
        facilities,
        slots,
        googleMapLink,
        landmark,
        state,
        city
    } = req.body;

    // Handle uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    try {
        const newBox = await Box.create({
            name,
            location,
            pricePerHour,
            discountPrice,
            details,
            facilities: facilities ? facilities.split(',').map(f => f.trim()) : [],
            slots: slots ? slots.split(',').map(s => s.trim()) : [],
            googleMapLink,
            landmark,
            state,
            city,
            images,
            userId: req.user.id  // Store the user who added this box
        });

        res.status(201).json({ status:true,message: '✅ Box added successfully', newBox });
    } catch (error) {
        console.error('❌ Error adding box:', error);
        res.status(500).json({ status:false,error: error.message });
    }
};



// 📋 Get All Boxes
exports.getAllBoxes = async (req, res) => {
    try {
        const boxes = await Box.findAll();
        res.json(boxes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔎 Get Box by ID
exports.getBoxesByUserId = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from token

        const boxes = await Box.findAll({
            where: { userId } // Filter by user ID
        });

        if (!boxes || boxes.length === 0) {
            return res.status(404).json({ message: 'No boxes found for this user' });
        }

        res.status(200).json({ status:true , message: '✅ Boxes fetched successfully', boxes });
    } catch (error) {
        console.error('❌ Error fetching boxes:', error);
        res.status(500).json({status:false , error: error.message });
    }
};

exports.getBoxById = async (req, res) => {
    const { id } = req.params;

    try {
        const box = await Box.findByPk(id); // Fetch box directly by ID

        if (!box) {
            return res.status(404).json({ status: false, message: '❌ Box not found' });
        }

        res.status(200).json({ status: true, message: '✅ Box fetched successfully', box });
    } catch (error) {
        console.error('❌ Error fetching box:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};


exports.getFilteredBoxes = async (req, res) => {
    const { location, minPrice, maxPrice } = req.query; // Extract query parameters

    try {
        const whereClause = {}; // Initialize empty filter object

        // Filter by location if provided
        if (location) {
            whereClause.location = { [Op.like]: `%${location}%` }; // Case-insensitive match
        }

        // Filter by price range if minPrice and maxPrice are provided
        if (minPrice && maxPrice) {
            whereClause.pricePerHour = { [Op.between]: [minPrice, maxPrice] };
        } else if (minPrice) {
            whereClause.pricePerHour = { [Op.gte]: minPrice }; // Greater than or equal to minPrice
        } else if (maxPrice) {
            whereClause.pricePerHour = { [Op.lte]: maxPrice }; // Less than or equal to maxPrice
        }

        // Fetch filtered boxes from database
        const boxes = await Box.findAll({ where: whereClause });

        if (!boxes || boxes.length === 0) {
            return res.status(200).json({ status: true, message: 'No boxes found', boxes: [] });
        }

        return res.status(200).json({ status: true, message: 'Boxes fetched successfully', boxes });
    } catch (error) {
        console.error('❌ Error fetching filtered boxes:', error);
        return res.status(500).json({ status: false, error: error.message });
    }
};


// ✏️ Update Box
exports.updateBox = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    // Handle images correctly
    const images = Array.isArray(req.files)
        ? req.files.map(file => `/uploads/${file.filename}`)
        : req.files
            ? [`/uploads/${req.files.filename}`]
            : [];

    try {
        const box = await Box.findByPk(id);

        if (!box) {
            return res.status(404).json({ status: false, message: '❌ Box not found' });
        }

        const existingImages = Array.isArray(box.images) 
            ? box.images 
            : box.images 
                ? [box.images] 
                : [];

        const finalImages = [...existingImages, ...images];

        await box.update({
            ...updatedData,
            images: finalImages
        });

        res.json({ status: true, message: '✅ Box updated successfully', box });
    } catch (error) {
        console.error('❌ Error updating box:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};





// ❌ Delete Box
exports.deleteBox = async (req, res) => {
    const { id } = req.params;

    try {
        const box = await Box.findByPk(id);
        if (!box) return res.status(404).json({ message: 'Box not found' });

        await box.destroy();
        res.json({ message: 'Box deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
