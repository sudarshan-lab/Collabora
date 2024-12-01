const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

//Helper function to validate and extract user ID from JWT
async function getUserIdFromToken(token) { 
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch (error) {
       // console.error("JWT Verification Error:", error); //Log the error for debugging
        if (error.name === 'TokenExpiredError') {
            return null; //Indicate token expired without sending a response yet
        } else if (error.name === 'JsonWebTokenError') {
            return null; // Indicate invalid token
        }
        return null; //Generic error
    }
}

app.post('/api/postDiscussion', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const { teamId, content, parentPostId } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Discussion content is required' });
    }

    try {   
        // Check if user is part of the team
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (userInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: User not part of this team' });
        }

        // Insert discussion
        const [result] = await pool.query(
            'INSERT INTO discussion (content, user_id, team_id) VALUES (?, ?, ?)',
            [content, userId, teamId]
        );
        const postId = result.insertId;

        // If it's a sub-discussion, add to the sub_discussion table
        if (parentPostId) {
            await pool.query(
                'INSERT INTO sub_discussion (post_id, parent_post_id) VALUES (?, ?)',
                [postId, parentPostId]
            );
        }

        // Fetch the added discussion with user details
        const [discussion] = await pool.query(
            `SELECT 
                d.post_id,
                d.content,
                d.posted_at,
                d.updated_at,
                u.user_id,
                u.first_name,
                u.last_name,
                u.email
            FROM discussion d
            JOIN user u ON d.user_id = u.user_id
            WHERE d.post_id = ?`,
            [postId]
        );

        res.status(201).json(discussion[0]);
    } catch (error) {
        console.error('Error creating discussion:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Update a discussion
app.put('/api/updateDiscussion', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const { teamId, content, postId } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Discussion content is required' });
    }

    try {
        //Check authorization (only the original poster can update, or admin)
        const [postAuthor] = await pool.query('SELECT user_id FROM discussion WHERE post_id = ?', [postId]);
        if(postAuthor.length === 0){
            return res.status(404).json({ message: 'Discussion not found' });
        }

        if(postAuthor[0].user_id !== userId){
            const [isAdmin] = await pool.query(
                'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ? AND role = "admin"',
                [userId, teamId]
            );
            if(isAdmin.length === 0){
                return res.status(403).json({ message: 'Forbidden: Only the original poster or an admin can update this discussion.' });
            }
        }

        await pool.query(
            'UPDATE discussion SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE post_id = ?',
            [content, postId]
        );
        res.json({ message: 'Discussion updated successfully' });
    } catch (error) {
        console.error('Error updating discussion:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a discussion
app.delete('/api/deleteDiscussion', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const { teamId, postId } = req.body;

    try {
        // Check if the discussion exists and retrieve the author
        const [postAuthor] = await pool.query('SELECT user_id FROM discussion WHERE post_id = ?', [postId]);
        if (postAuthor.length === 0) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        // Verify if the user is authorized to delete (author or admin)
        if (postAuthor[0].user_id !== userId) {
            const [isAdmin] = await pool.query(
                'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ? AND role = "admin"',
                [userId, teamId]
            );
            if (isAdmin.length === 0) {
                return res.status(403).json({ message: 'Forbidden: Only the original poster or an admin can delete this discussion.' });
            }
        }

        // Find all sub-discussion IDs related to this discussion
        const [subDiscussionIds] = await pool.query(
            'SELECT post_id FROM sub_discussion WHERE parent_post_id = ?',
            [postId]
        );

        const subDiscussionIdsList = subDiscussionIds.map((row) => row.post_id);

        if (subDiscussionIdsList.length > 0) {
            // Delete all sub-discussions from the `discussion` table
            await pool.query(
                'DELETE FROM discussion WHERE post_id IN (?)',
                [subDiscussionIdsList]
            );

            // Cleanup `sub_discussion` table relationships
            await pool.query(
                'DELETE FROM sub_discussion WHERE post_id IN (?)',
                [subDiscussionIdsList]
            );
        }

        // Delete the main discussion from the `discussion` table
        await pool.query('DELETE FROM discussion WHERE post_id = ?', [postId]);

        res.json({ message: 'Discussion and its sub-discussions deleted successfully' });
    } catch (error) {
        console.error('Error deleting discussion:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Get all discussions and their sub-discussions
app.get('/api/allDiscussions/:teamId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const teamId = parseInt(req.params.teamId);

    try {
        // Authorization check: Verify if the user belongs to the team
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (userInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: You are not a member of this team.' });
        }

        // Fetch parent discussions with user details
        const [parentDiscussions] = await pool.query(
            `SELECT 
                d.post_id,
                d.content,
                d.posted_at,
                d.updated_at,
                u.user_id,
                u.first_name,
                u.last_name,
                u.email
            FROM discussion d
            JOIN user u ON d.user_id = u.user_id
            WHERE d.post_id NOT IN (SELECT post_id FROM sub_discussion) AND d.team_id = ?
            ORDER BY d.posted_at DESC`,
            [teamId]
        );

        // Fetch sub-discussions with user details
        const [subDiscussions] = await pool.query(
            `SELECT 
                sd.parent_post_id,
                d.post_id,
                d.content,
                d.posted_at,
                d.updated_at,
                u.user_id,
                u.first_name,
                u.last_name,
                u.email
            FROM discussion d
            JOIN sub_discussion sd ON d.post_id = sd.post_id
            JOIN user u ON d.user_id = u.user_id
            WHERE d.team_id = ?
            ORDER BY d.posted_at DESC`,
            [teamId]
        );

        // Organize the data into nested JSON structure
        const discussions = parentDiscussions.map(parent => {
            const subDiscussionsForParent = subDiscussions.filter(sub => sub.parent_post_id === parent.post_id);
            return { ...parent, subDiscussions: subDiscussionsForParent };
        });

        res.json({ discussions });
    } catch (error) {
        console.error('Error getting discussions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


module.exports = app;