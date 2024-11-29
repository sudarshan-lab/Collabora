const express = require('express');
const { connect } = require('./db'); // Import database connection
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//const router = express.Router();
const app = express();

const JWT_SECRET = process.env.JWT_SECRET;


app.post('/api/users/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const connection = await connect();
        //1. Check if the email exists in the database
        const [rows] = await connection.execute(
            'SELECT * FROM user WHERE email = ?',
            [email]
        );

        //If no user was found with that email
        if (rows.length === 0) {
            await connection.end();
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];
        //2. Compare the password using bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            await connection.end();
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        //3. Generate a JWT
        const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '1h' }); // Adjust expiry as needed

        await connection.end();
        res.json({ message: 'Login successful', token }); // Send the token in the response

    } catch (error) {
        console.error('Error during login:', error);
        await connection.end(); //Close the connection even if an error occurs
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.post('/api/users/signup', async (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    try {
        const connection = await connect();

        // Check if email already exists (prevent duplicate emails)
        const [emailResults] = await connection.execute(
            'SELECT 1 FROM user WHERE email = ?',
            [email]
        );

        if (emailResults.length > 0) {
            await connection.end();
            return res.status(409).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

        // Insert new user (parameterized query to prevent SQL injection)
        const [results] = await connection.execute(
            'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
            [firstname, lastname, email, hashedPassword]
        );

        const userId = results.insertId; //Get the auto-generated ID

        if (userId) {
            await connection.query('COMMIT');
            await connection.end();
            res.status(201).json({ message: 'User created successfully', userId });
        } else {
            await connection.query('ROLLBACK');
            await connection.end();
            res.status(500).json({ message: 'Failed to create user' });
        }
    } catch (error) {
        await connection.query('ROLLBACK');
        console.error('Error during signup:', error);
        await connection.end(); // Ensure the connection is closed even if there's an error
        res.status(500).json({ message: 'Server error', error: error.message }); //Include error message for debugging
    }
});



module.exports = app;