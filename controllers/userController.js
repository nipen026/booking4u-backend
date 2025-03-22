const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔒 Register User
exports.register = async (req, res) => {
    const { email, username, password, dob, role, firstName, lastName,phone } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, username, password: hashedPassword, dob, role, firstName, lastName,phone });

        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔐 Login User
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ status: false, message: '❌ User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: false, message: '❌ Invalid credentials' });
        }

        // Generate token based on user role
        const expiresIn = user.role === 'admin' ? '1d' : '7d'; // Admin: 1 day, User: 7 days
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        res.json({
            status: true,
            message: '✅ Login successful',
            token,
            role: user.role 
        });

    } catch (error) {
        console.error('❌ Error during login:', error);
        res.status(500).json({ status: false, error: error.message });
    }
};

// 📋 Get All Users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { id: req.user.id }  // Use user data from middleware
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// 📝 Update User
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.update(updatedData);
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ❌ Delete User
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
