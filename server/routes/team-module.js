const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const app = express();

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

app.post('/api/createTeam', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const [userExists] = await pool.query('SELECT 1 FROM user WHERE user_id = ?', [userId]);
        if (userExists.length === 0) {
            return res.status(403).json({ message: 'Forbidden: User does not exist' });
        }

        const { team_name, team_description } = req.body;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [teamResults] = await connection.query(
                'INSERT INTO team (team_name, team_description) VALUES (?, ?)',
                [team_name, team_description]
            );
            const teamId = teamResults.insertId;

            await connection.query(
                'INSERT INTO user_team (user_id, team_id, role) VALUES (?, ?, ?)',
                [userId, teamId, 'admin']
            );

            await connection.commit();
            res.status(201).json({ message: 'Team created successfully', teamId });
        } catch (error) {
            await connection.rollback();
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ message: 'Team name already exists' });
            } else {
                res.status(500).json({ message: 'Failed to create team', error: error.message });
            }
        } finally {
            connection.release();
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.get('/api/user/teams', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = req.query.user_id;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.userId != userId) {
            return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
        }

        const [teams] = await pool.query(
            `
            SELECT 
                t.*, 
                ut.role, 
                (SELECT COUNT(*) FROM user_team WHERE team_id = t.team_id) AS member_count
            FROM 
                team t 
            JOIN 
                user_team ut 
            ON 
                t.team_id = ut.team_id 
            WHERE 
                ut.user_id = ?
            `,
            [userId]
        );
        

        res.json({ teams });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.get('/teams/:teamId', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const teamId = parseInt(req.params.teamId);
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }

    if (isNaN(teamId) || teamId <= 0) {
        return res.status(400).json({ message: 'Invalid teamId' });
    }

    try {
        const [teamData] = await pool.query(
            `SELECT 
                t.*, 
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'userId', u.user_id,
                        'firstName', u.first_name,
                        'lastName', u.last_name,
                        'email', u.email,
                        'role', ut.role
                    )
                ) AS users
             FROM team t 
             JOIN user_team ut ON t.team_id = ut.team_id
             JOIN user u ON ut.user_id = u.user_id
             WHERE t.team_id = ?
             GROUP BY t.team_id`,
            [teamId]
        );

        if (teamData.length === 0) {
            return res.status(404).json({ message: 'Team not found' });
        }
        const teamDetails = { ...teamData[0], users: teamData[0].users };
        res.json({ team: teamDetails });

    } catch (error) {
        console.error('Error getting team:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all users for a given team ID
app.get('/api/allUsersInTeam/:teamId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const teamId = parseInt(req.params.teamId);

    if (isNaN(teamId) || teamId <= 0) {
        return res.status(400).json({ message: 'Invalid teamId' });
    }

    try {
        //Check if the requesting user belongs to this team.  This adds an authorization layer.
        const [requesterInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if(requesterInTeam.length === 0){
            return res.status(403).json({ message: 'Forbidden: You are not a member of this team.' });
        }

        const [teamUsers] = await pool.query(
            `
            SELECT 
                u.user_id, u.first_name, u.last_name, u.email, ut.role
            FROM 
                user u
            JOIN 
                user_team ut ON u.user_id = ut.user_id
            WHERE 
                ut.team_id = ?
            `,
            [teamId]
        );

        res.json({ users: teamUsers });
    } catch (error) {
        console.error('Error fetching team users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add a user to a team
app.post('/api/addNewUser', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    
    const { teamId, userEmail } = req.body; // Get user's email from the request body

    if (!userEmail) {
        return res.status(400).json({ message: 'User email is required' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Check if team exists
        const [teamExists] = await connection.query('SELECT 1 FROM team WHERE team_id = ?', [teamId]);
        if (teamExists.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Team not found' });
        }

        // 2. Check if the adding user is in the team
        const [adderInTeam] = await connection.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (adderInTeam.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: 'Forbidden: Adding user not in the team' });
        }

        // 3. Find the user to add by email
        const [userToAdd] = await connection.query('SELECT user_id FROM user WHERE email = ?', [userEmail]);
        if (userToAdd.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `User with email ${userEmail} not found` });
        }

        // 4. Check if user is already in the team
        const [userAlreadyInTeam] = await connection.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userToAdd[0].user_id, teamId]
        );
        if (userAlreadyInTeam.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: `User already in team` });
        }

        // 5. Add the user to the team
        await connection.query(
            'INSERT INTO user_team (user_id, team_id, role) VALUES (?, ?, ?)',
            [userToAdd[0].user_id, teamId, 'member']
        );

        await connection.commit();
        res.json({ message: 'User added to team successfully' });
    } catch (error) {
       // await connection.rollback();
        console.error('Error adding user to team:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
       // connection.release();
    }
});

app.delete('/api/removeUser', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const { teamId, userIdToRemove } = req.body; //Get userId from request body

    if (!userIdToRemove) {
        return res.status(400).json({ message: 'User ID to remove is required' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Check if team exists (same as addUser)
        const [teamExists] = await connection.query('SELECT 1 FROM team WHERE team_id = ?', [teamId]);
        if (teamExists.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Team not found' });
        }

        // 2. Check if removing user is in the team
        const [removerInTeam] = await connection.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (removerInTeam.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: 'Forbidden: Removing user not in the team' });
        }

        // 3. Remove the user from the team
        const [rowsAffected] = await connection.query(
            'DELETE FROM user_team WHERE user_id = ? AND team_id = ?',
            [userIdToRemove, teamId]
        );
        if (rowsAffected.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `User not found in this team` });
        }

        await connection.commit();
        res.json({ message: 'User removed from team successfully' });
    } catch (error) {
       // await connection.rollback();
        console.error('Error removing user from team:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
       // connection.release();
    }
});

module.exports = app;
