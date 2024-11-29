const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const app = express();

const JWT_SECRET = process.env.JWT_SECRET;

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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const teamId = parseInt(req.params.teamId);

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    if (isNaN(teamId) || teamId <= 0) {
        return res.status(400).json({ message: 'Invalid team ID' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const [teamData] = await pool.query(
            `SELECT t.*, ut.role 
             FROM team t 
             JOIN user_team ut ON t.team_id = ut.team_id 
             WHERE t.team_id = ? AND ut.user_id = ?`,
            [teamId, userId]
        );

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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = app;
