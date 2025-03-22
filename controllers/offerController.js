const Offer = require('../models/offer');

// ➤ Create Offer
exports.createOffer = async (req, res) => {
    try {
        const offer = await Offer.create(req.body);
        res.status(201).json({ message: '✅ Offer created successfully', offer });
    } catch (error) {
        res.status(500).json({ error: '❌ Failed to create offer', details: error.message });
    }
};

// ➤ Get All Offers
exports.getAllOffers = async (req, res) => {
    try {
        const offers = await Offer.findAll();
        res.status(200).json(offers);
    } catch (error) {
        res.status(500).json({ error: '❌ Failed to fetch offers', details: error.message });
    }
};

// ➤ Get Offer by ID
exports.getOfferById = async (req, res) => {
    try {
        const offer = await Offer.findByPk(req.params.id);
        if (!offer) return res.status(404).json({ error: '❌ Offer not found' });
        res.status(200).json(offer);
    } catch (error) {
        res.status(500).json({ error: '❌ Failed to fetch offer', details: error.message });
    }
};

// ➤ Update Offer
exports.updateOffer = async (req, res) => {
    try {
        const [updated] = await Offer.update(req.body, { where: { id: req.params.id } });
        if (!updated) return res.status(404).json({ error: '❌ Offer not found' });
        res.status(200).json({ message: '✅ Offer updated successfully' });
    } catch (error) {
        res.status(500).json({ error: '❌ Failed to update offer', details: error.message });
    }
};

// ➤ Delete Offer
exports.deleteOffer = async (req, res) => {
    try {
        const deleted = await Offer.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ error: '❌ Offer not found' });
        res.status(200).json({ message: '✅ Offer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: '❌ Failed to delete offer', details: error.message });
    }
};
