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

app.get('/api/allnotifications', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }

    const limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
    const offset = parseInt(req.query.offset, 10) || 0; // Default offset is 0

    try {
        // Fetch notifications for the user, including team names, with pagination
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
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        res.json({ notifications });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// API to update the read status of a notification
app.put('/api/read/notification/:notificationId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const notificationId = parseInt(req.params.notificationId);

    try {
        // Check if the notification exists and belongs to the user
        const [notificationExists] = await pool.query(
            'SELECT 1 FROM notification_recipients WHERE notification_id = ? AND user_id = ?',
            [notificationId, userId]
        );
        if (notificationExists.length === 0) {
            return res.status(404).json({ message: 'Notification not found for this user' });
        }

        // Update the read status
        await pool.query(
            'UPDATE notification_recipients SET read_status = TRUE WHERE notification_id = ? AND user_id = ?',
            [notificationId, userId]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error updating notification read status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



module.exports = app;