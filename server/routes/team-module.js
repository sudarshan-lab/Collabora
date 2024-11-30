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

        // Create the team
        const [teamResults] = await pool.query(
            'INSERT INTO team (team_name, team_description) VALUES (?, ?)',
            [team_name, team_description]
        );
        const teamId = teamResults.insertId;

        // Assign the admin role to the user for the created team
        await pool.query(
            'INSERT INTO user_team (user_id, team_id, role) VALUES (?, ?, ?)',
            [userId, teamId, 'admin']
        );

        // Fetch the newly created team details
        const [createdTeamDetails] = await pool.query(
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
                t.team_id = ?
            `,
            [teamId]
        );

        res.status(201).json({ message: 'Team created successfully', team: createdTeamDetails[0] });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Team name already exists' });
        } else if (error.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ message: 'Unauthorized: Invalid token' });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
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
app.post('/api/teams/:teamId/add-members', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { teamId } = req.params;
    const { emails } = req.body;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ message: 'Invalid email list provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Verify that the user is an admin of the team
        const [teamAdmin] = await pool.query(
            `SELECT role FROM user_team WHERE team_id = ? AND user_id = ?`,
            [teamId, userId]
        );

        if (!teamAdmin.length || teamAdmin[0].role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can add members to the team' });
        }

        // Fetch user IDs for the provided emails
        const [existingUsers] = await pool.query(
            `SELECT user_id, email, first_name, last_name FROM user WHERE email IN (?)`,
            [emails]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({ message: 'No users found for the provided emails' });
        }

        // Add each user to the team if not already a member
        const addUserPromises = existingUsers.map((user) =>
            pool.query(
                `INSERT IGNORE INTO user_team (user_id, team_id, role) VALUES (?, ?, ?)`,
                [user.user_id, teamId, 'member']
            )
        );
        await Promise.all(addUserPromises);

        // Fetch all team members after adding
        const [teamMembers] = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email, ut.role
             FROM user_team ut
             JOIN user u ON ut.user_id = u.user_id
             WHERE ut.team_id = ?`,
            [teamId]
        );

        res.json({ members: teamMembers });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        console.error('Error adding members:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



app.delete('/api/teams/:teamId/remove-member', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { teamId } = req.params;
    const { userId } = req.body;
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
  
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID provided' });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const requestingUserId = decoded.userId;
  
      // Verify that the requesting user is an admin of the team
      const [teamAdmin] = await pool.query(
        `SELECT role FROM user_team WHERE team_id = ? AND user_id = ?`,
        [teamId, requestingUserId]
      );
  
      if (!teamAdmin.length || teamAdmin[0].role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can remove members from the team' });
      }
  
      // Check if the user being removed is a member of the team
      const [existingMember] = await pool.query(
        `SELECT * FROM user_team WHERE team_id = ? AND user_id = ?`,
        [teamId, userId]
      );
  
      if (!existingMember.length) {
        return res.status(404).json({ message: 'User is not a member of the team' });
      }
  
      // Remove the user from the team
      await pool.query(
        `DELETE FROM user_team WHERE team_id = ? AND user_id = ?`,
        [teamId, userId]
      );
  
      res.json({ message: 'Member removed successfully', userId });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Unauthorized: Token expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
      console.error('Error removing member:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  

app.get('/api/teams/:teamId', async (req, res) => {
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

        // Query to get team details
        const [teamData] = await pool.query(
            `SELECT t.team_id, t.team_name, t.team_description, t.created_at, ut.role
             FROM team t 
             JOIN user_team ut ON t.team_id = ut.team_id 
             WHERE t.team_id = ? AND ut.user_id = ?`,
            [teamId, userId]
        );

        if (teamData.length === 0) {
            return res.status(404).json({ message: 'Team not found or user is not a member' });
        }

        // Query to get team members
        const [teamMembers] = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email, ut.role 
             FROM user u
             JOIN user_team ut ON u.user_id = ut.user_id
             WHERE ut.team_id = ?`,
            [teamId]
        );

        res.json({
            team: teamData[0],
            members: teamMembers,
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


app.put('/api/teams/:teamId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const teamId = parseInt(req.params.teamId);
    const { team_name, team_description } = req.body;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    if (isNaN(teamId) || teamId <= 0) {
        return res.status(400).json({ message: 'Invalid team ID' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Check if the user is part of the team
        const [team] = await pool.query(
            `SELECT * FROM user_team WHERE team_id = ? AND user_id = ?`,
            [teamId, userId]
        );

        if (team.length === 0) {
            return res.status(403).json({ message: 'Access denied: Not a team member' });
        }

        // Update the team details
        await pool.query(
            `UPDATE team SET team_name = ?, team_description = ? WHERE team_id = ?`,
            [team_name, team_description, teamId]
        );

        res.json({ message: 'Team details updated successfully' });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.put('/api/teams/:teamId/update-role', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { teamId } = req.params;
    const { userId, role } = req.body;
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
  
    if (!userId || !role || (role !== 'admin' && role !== 'member')) {
      return res.status(400).json({ message: 'Invalid user ID or role provided' });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const requestingUserId = decoded.userId;
  
      // Verify that the requesting user is an admin of the team
      const [teamAdmin] = await pool.query(
        `SELECT role FROM user_team WHERE team_id = ? AND user_id = ?`,
        [teamId, requestingUserId]
      );
  
      if (!teamAdmin.length || teamAdmin[0].role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can update member roles' });
      }
  
      // Check if the user being updated is a member of the team
      const [existingMember] = await pool.query(
        `SELECT * FROM user_team WHERE team_id = ? AND user_id = ?`,
        [teamId, userId]
      );
  
      if (!existingMember.length) {
        return res.status(404).json({ message: 'User is not a member of the team' });
      }
  
      // Update the user's role
      await pool.query(
        `UPDATE user_team SET role = ? WHERE team_id = ? AND user_id = ?`,
        [role, teamId, userId]
      );
  
      res.json({ message: 'Member role updated successfully', userId, role });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Unauthorized: Token expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
      console.error('Error updating member role:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  app.delete('/api/teams/:teamId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { teamId } = req.params;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Verify the user is an admin of the team
        const [teamAdmin] = await pool.query(
            `SELECT role FROM user_team WHERE team_id = ? AND user_id = ?`,
            [teamId, userId]
        );

        if (!teamAdmin.length || teamAdmin[0].role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can remove teams.' });
        }

        // Delete the team and associated records
        await pool.query(`DELETE FROM user_team WHERE team_id = ?`, [teamId]);
        await pool.query(`DELETE FROM team WHERE team_id = ?`, [teamId]);

        res.json({ message: 'Team removed successfully', teamId });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        console.error('Error removing team:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

  


module.exports = app;
