const express = require('express');
const pool = require('../db'); // Import the database pool
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({
            message: 'Login successful',
            token,
            user: {
                userId: user.user_id,
                firstName: user.first_name, 
                lastName: user.last_name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Signup Route
router.post('/signup', async (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    try {
        const [emailResults] = await pool.query('SELECT 1 FROM user WHERE email = ?', [email]);

        if (emailResults.length > 0) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [results] = await pool.query(
            'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
            [firstname, lastname, email, hashedPassword]
        );

        const userId = results.insertId;

        res.status(201).json({ message: 'User created successfully', userId });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
