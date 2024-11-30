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

//post a new discussion
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

        const [result] = await pool.query(
            'INSERT INTO discussion (content, user_id, team_id) VALUES (?, ?, ?)',
            [content, userId, teamId]
        );
        const postId = result.insertId;

        if (parentPostId) {
            await pool.query(
                'INSERT INTO sub_discussion (post_id, parent_post_id) VALUES (?, ?)',
                [postId, parentPostId]
            );
        }

        res.status(201).json({ message: 'Discussion created successfully', postId });
    } catch (error) {
        console.error('Error creating discussion:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
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
        //Check authorization (only the original poster can delete, or admin)
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
                return res.status(403).json({ message: 'Forbidden: Only the original poster or an admin can delete this discussion.' });
            }
        }

        await pool.query('DELETE FROM discussion WHERE post_id = ?', [postId]);
        res.json({ message: 'Discussion deleted successfully' });
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

        // Fetch parent discussions
        const [parentDiscussions] = await pool.query(
            'SELECT * FROM discussion WHERE post_id NOT IN (SELECT post_id FROM sub_discussion) AND team_id = ?',
            [teamId]
        );

        // Fetch sub-discussions
        const [subDiscussions] = await pool.query(
            'SELECT sd.parent_post_id, d.* FROM discussion d JOIN sub_discussion sd ON d.post_id = sd.post_id WHERE d.team_id = ?',
            [teamId]
        );

        //Organize the data into nested JSON structure
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