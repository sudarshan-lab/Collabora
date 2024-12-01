const express = require('express');
const pool = require('../db'); // Your database connection pool
const app = express();
app.use(express.json());
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

//Helper function (same as before)
async function getUserIdFromToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch (error) {
        console.error("JWT Verification Error:", error);
        return null;
    }
}

// API to get a list of all notifications for the logged-in user
app.get('/api/allnotifications', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }

    try {
        // Fetch notifications for the user, including team names
        const [notifications] = await pool.query(`
            SELECT 
                n.*, 
                t.team_name,
                nr.read_status
            FROM 
                notification_recipients nr
            JOIN 
                notification n ON nr.notification_id = n.notification_id
            LEFT JOIN 
                team t ON n.team_id = t.team_id
            WHERE 
                nr.user_id = ?
            ORDER BY n.notified_at DESC
        `, [userId]);

        res.json({ notifications });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


module.exports = app;