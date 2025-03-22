const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.registerAdmin = async (req, res) => {
    const { 
        email, 
        username, 
        password, 
        dob, 
        firstName, 
        lastName, 
        role,
        phone,
        country,
        state
    } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Role check for admin creation
        if (role === 'admin' && req.user?.role !== 'superuser') {
            return res.status(403).json({ error: 'Only superuser can create admin' });
        }

        const newUser = await User.create({
            email,
            username,
            password: hashedPassword,
            dob,
            firstName,
            lastName,
            role,
            phone,
            country,
            state
        });

        res.status(201).json({
            status:true,
            message: '✅ Admin registered successfully',
            user: newUser
        });

    } catch (error) {
        res.status(500).json({status:false, error: '❌ Failed to register admin', details: error.message });
    }
};

exports.createSuperuser = async (req, res) => {
    const { email, username, password } = req.body;

    // Check if Superuser already exists
    const existingSuperuser = await User.findOne({ where: { role: 'superuser' } });
    if (existingSuperuser) {
        return res.status(400).json({ error: 'Superuser already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Superuser
    await User.create({
        email,
        username,
        password: hashedPassword,
        role: 'superuser'
    });
    res.status(201).json({ message: 'Superuser created successfully.' });
};
exports.superuserLogin = async (req, res) => {
    const { email, password } = req.body;

    // Check if Superuser Exists
    const superuser = await User.findOne({ where: { email, role: 'superuser' } });
    if (!superuser) {
        return res.status(404).json({ error: 'Superuser not found' });
    }

    // Password Validation
    const isMatch = await bcrypt.compare(password, superuser.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT Token
    const token = jwt.sign(
        { id: superuser.id, role: 'superuser' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }  // Token valid for 7 days
    );

    res.status(200).json({ message: 'Login successful', token });
};
exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ status:true,token });
};
