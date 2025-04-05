    const { Op } = require('sequelize');  // Import Sequelize operators
    const Box = require('../models/Box');
    const Turf = require('../models/Turf'); // Make sure you import this model

    // ➕ Add Box

    exports.addBox = async (req, res) => {
        try {
            const {
                name,
                location,
                pricePerHour,
                discountPrice,
                details,
                facilities,
                googleMapLink,
                landmark,
                state,
                city
            } = req.body;
    
            // Parse JSON string arrays if needed
            const parsedFacilities = Array.isArray(facilities) ? facilities : JSON.parse(facilities || '[]');
    
            const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
            // ✅ Create the box (No Turf handling)
            const newBox = await Box.create({
                name,
                location,
                pricePerHour,
                discountPrice,
                details,
                facilities: parsedFacilities,
                googleMapLink,
                landmark,
                state,
                city,
                images,
                userId: req.user.id
            });
    
            res.status(201).json({
                status: true,
                message: '✅ Box created successfully',
                newBox
            });
        } catch (error) {
            console.error('❌ Error adding box:', error);
            res.status(500).json({ status: false, error: error.message });
        }
    };
    
    
    




    // 📋 Get All Boxes
    exports.getAllBoxes = async (req, res) => {
        try {
            // Fetch all boxes
            const boxes = await Box.findAll();
    
            // Get all turfs grouped by boxId
            const turfs = await Turf.findAll();
            const turfMap = {};
    
            turfs.forEach(turf => {
                if (!turfMap[turf.boxId]) {
                    turfMap[turf.boxId] = [];
                }
                turfMap[turf.boxId].push(turf);
            });
    
            // Attach turfs to corresponding boxes
            const boxesWithTurfs = boxes.map(box => {
                return {
                    ...box.toJSON(),
                    turfs: turfMap[box.id] || []
                };
            });
    
            res.json(boxesWithTurfs);
        } catch (error) {
            console.error('❌ Error fetching boxes with turfs:', error);
            res.status(500).json({ error: error.message });
        }
    };

    // 🔎 Get Box by ID
    exports.getBoxesByUserId = async (req, res) => {
        try {
            const userId = req.user.id;
    
            // Get boxes owned by the user
            const boxes = await Box.findAll({ where: { userId } });
    
            if (!boxes || boxes.length === 0) {
                return res.status(200).json({ status: true, message: 'No boxes found for this user', boxes: [] });
            }
    
            // Extract boxIds
            const boxIds = boxes.map(box => box.id);
    
            // Get all turfs related to those boxes
            const turfs = await Turf.findAll({
                where: { boxId: boxIds }
            });
    
            // Group turfs by boxId
            const turfMap = {};
            turfs.forEach(turf => {
                if (!turfMap[turf.boxId]) turfMap[turf.boxId] = [];
                turfMap[turf.boxId].push(turf);
            });
    
            // Merge turf data into each box
            const boxesWithTurfs = boxes.map(box => ({
                ...box.toJSON(),
                turfs: turfMap[box.id] || []
            }));
    
            res.status(200).json({
                status: true,
                message: '✅ Boxes with turf data fetched successfully',
                boxes: boxesWithTurfs
            });
    
        } catch (error) {
            console.error('❌ Error fetching boxes:', error);
            res.status(500).json({ status: false, error: error.message });
        }
    };

    exports.getBoxById = async (req, res) => {
        const { id } = req.params;
    
        try {
            // Fetch box
            const box = await Box.findByPk(id);
    
            if (!box) {
                return res.status(200).json({ status: false, message: '❌ Box not found' });
            }
    
            // Fetch turfs manually by boxId
            const turfs = await Turf.findAll({ where: { boxId: id } });
    
            res.status(200).json({
                status: true,
                message: '✅ Box fetched successfully',
                box: {
                    ...box.toJSON(),
                    turfs
                }
            });
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
