const express = require('express');
const { connect } = require('./db');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const app = express();

// Define a secret key for JWT signing.  Keep this secure!
const JWT_SECRET = process.env.JWT_SECRET;

app.post('/api/createTeam', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        //Check if the user exists (simpler authorization check)
        const connection = await connect();
        const [userExists] = await connection.execute(
            'SELECT 1 FROM user WHERE user_id = ?',
            [userId]
        );

        if (userExists.length === 0) {
            await connection.end();
            return res.status(403).json({ message: 'Forbidden: User does not exist' });
        }

        const { team_name, team_description } = req.body;


        // Begin transaction for atomicity
        await connection.query('START TRANSACTION');
        try {
            // 1. Insert into the `team` table
            const [teamResults] = await connection.execute(
                'INSERT INTO team (team_name, team_description) VALUES (?, ?)',
                [team_name, team_description]
            );
            const teamId = teamResults.insertId;

            // 2. Insert into the `user_team` table (user is automatically admin)
            const [userTeamResults] = await connection.execute(
                'INSERT INTO user_team (user_id, team_id, role) VALUES (?, ?, ?)',
                [userId, teamId, 'admin'] // User is admin by default
            );

            await connection.query('COMMIT');
            res.status(201).json({ message: 'Team created successfully', teamId });
        } catch (error) {
            await connection.query('ROLLBACK');
            console.error('Error creating team:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ message: 'Team name already exists' });
            } else {
                res.status(500).json({ message: 'Failed to create team', error: error.message });
            }
        } finally {
            await connection.end();
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.get('/api/allteams', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const connection = await connect();

        //Retrieve all teams for this user using a parameterized query
        const [teams] = await connection.execute(
            'SELECT t.*, ut.role FROM team t JOIN user_team ut ON t.team_id = ut.team_id WHERE ut.user_id = ?',
            [userId]
        );

        await connection.end();
        res.json({ teams });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        console.error('Error retrieving teams:', error);
        await connection.end();
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.get('/teams/:teamId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const teamId = parseInt(req.params.teamId); //Extract teamId from URL parameters

    if (token == null) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    if (isNaN(teamId) || teamId <= 0) {
        return res.status(400).json({ message: 'Invalid team ID' });
    }


    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const connection = await connect();

        //Check if the team exists and the user is a member of the team.
        const [teamData] = await connection.execute(
            `SELECT t.*, ut.role 
             FROM team t 
             JOIN user_team ut ON t.team_id = ut.team_id 
             WHERE t.team_id = ? AND ut.user_id = ?`,
            [teamId, userId]
        );


        await connection.end();

        if (teamData.length === 0) {
            return res.status(404).json({ message: 'Team not found or user is not a member' });
        }

        res.json({ team: teamData[0] });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        console.error('Error retrieving team:', error);
        await connection.end();
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = app;