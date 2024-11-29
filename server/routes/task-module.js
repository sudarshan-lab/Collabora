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


// Create a new task
app.post('/api/createTask', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token, res);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' }); //Handle unauthorized access here
    }

    try {
        const { task_name, task_description, due_date, team_id, parent_task_id } = req.body;

        //Input validation
        if (!task_name || !team_id) {
            return res.status(400).json({ message: 'Task name and team ID are required' });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        //Check if user belongs to the team
        const [userInTeam] = await connection.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, team_id]
        );
        if(userInTeam.length === 0){
            await connection.rollback();
            return res.status(403).json({message: 'Forbidden: User not part of this team'});
        }
        //Check if parent task exists (optional)
        if (parent_task_id) {
            const [parentTaskExists] = await connection.query(
                'SELECT 1 FROM task WHERE task_id = ?',
                [parent_task_id]
            );
            if (parentTaskExists.length === 0) {
                await connection.rollback();
                return res.status(400).json({ message: 'Parent task does not exist' });
            }
        }

        const [result] = await connection.query(
            'INSERT INTO task (task_name, task_description, due_date, team_id) VALUES (?, ?, ?, ?)',
            [task_name, task_description, due_date, team_id]
        );
        const taskId = result.insertId;

        // Add subtask relationship if parent_task_id is provided
        if (parent_task_id) {
            await connection.query(
                'INSERT INTO sub_task (task_id, parent_task_id) VALUES (?, ?)',
                [taskId, parent_task_id]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Task created successfully', taskId });
    } catch (error) {
       // await connection.rollback();
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        //connection.release();
    }
});

// Get all tasks for a specific team
app.get('/api/alltasks/:teamId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token, res);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' }); //Handle unauthorized access here
    }
    const teamId = parseInt(req.params.teamId);

    try {
        //Check if user belongs to the team
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if(userInTeam.length === 0){
            return res.status(403).json({message: 'Forbidden: User not part of this team'});
        }

        const [tasks] = await pool.query(
            'SELECT * FROM task WHERE team_id = ?',
            [teamId]
        );
        res.json({ tasks });
    } catch (error) {
        console.error('Error getting tasks:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


//Update a task
app.put('/api/updateTask/:taskId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token, res);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' }); //Handle unauthorized access here
    }
    const taskId = parseInt(req.params.taskId);

    try {
        const { task_name, task_description, due_date, status } = req.body;
        const updates = {};

        if (task_name) updates.task_name = task_name;
        if (task_description) updates.task_description = task_description;
        if (due_date) updates.due_date = due_date;
        if (status) updates.status = status;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        // Check if task exists and user has access to update
        const [taskExists] = await pool.query(
            'SELECT team_id FROM task WHERE task_id = ?',
            [taskId]
        );

        if (taskExists.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const teamId = taskExists[0].team_id;

         //Check if user belongs to the team
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if(userInTeam.length === 0){
            return res.status(403).json({message: 'Forbidden: User not part of this team'});
        }

        let updateSql = 'UPDATE task SET ';
        let updateValues = [];
        for (let key in updates) {
            updateSql += `${key} = ?, `;
            updateValues.push(updates[key]);
        }
        updateSql = updateSql.slice(0, -2); // Remove trailing comma and space
        updateSql += ` WHERE task_id = ?`;
        updateValues.push(taskId);

        await pool.query(updateSql, updateValues);
        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a task
app.delete('/api/deleteTask/:taskId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token, res);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' }); //Handle unauthorized access here
    }
    const taskId = parseInt(req.params.taskId);

    try {
        //Check if task exists and user has access to delete
        const [taskExists] = await pool.query(
            'SELECT team_id FROM task WHERE task_id = ?',
            [taskId]
        );

        if (taskExists.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const teamId = taskExists[0].team_id;

         //Check if user belongs to the team
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if(userInTeam.length === 0){
            return res.status(403).json({message: 'Forbidden: User not part of this team'});
        }

        await pool.query('DELETE FROM task WHERE task_id = ?', [taskId]);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Assign user to task
app.post('/api/assignUserToTask', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token, res);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' }); //Handle unauthorized access here
    }
   // const taskId = parseInt(req.params.taskId);
    const { taskId, user_id_to_assign } = req.body;

    if (!user_id_to_assign) {
        return res.status(400).json({ message: 'User ID to assign is required' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Check if task exists
        const [taskExists] = await connection.query(
            'SELECT team_id FROM task WHERE task_id = ?',
            [taskId]
        );
        if (taskExists.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Task not found' });
        }
        const teamId = taskExists[0].team_id;


        // 2. Check if the assigning user belongs to the team
        const [assignerInTeam] = await connection.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (assignerInTeam.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: 'Forbidden: Assigning user not in the team' });
        }


        // 3. Check if user to assign belongs to the team
        const [userToAssignInTeam] = await connection.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [user_id_to_assign, teamId]
        );
        if (userToAssignInTeam.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: 'Forbidden: User to assign not in the team' });
        }


        // 4. Assign user to task (insert into user_task)
        await connection.query(
            'INSERT INTO user_task (user_id, task_id) VALUES (?, ?)',
            [user_id_to_assign, taskId]
        );

        await connection.commit();
        res.json({ message: 'User assigned to task successfully' });
    } catch (error) {
       // await connection.rollback();
        console.error('Error assigning user to task:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'User is already assigned to this task' });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    } finally {
       // connection.release();
    }
});

app.put('/api/updateUserToTask', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }

    const {taskId, user_id_to_assign } = req.body;

    if (!user_id_to_assign) {
        return res.status(400).json({ message: 'User ID to assign is required' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Check if task exists
        const [taskExists] = await connection.query(
            'SELECT team_id FROM task WHERE task_id = ?',
            [taskId]
        );
        if (taskExists.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Task not found' });
        }
        const teamId = taskExists[0].team_id;

        // 2. Check if the updating user is in the team
        const [updaterInTeam] = await connection.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (updaterInTeam.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: 'Forbidden: Updating user not in the team' });
        }

         // 3. Check if user to assign belongs to the team
        const [userToAssignInTeam] = await connection.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [user_id_to_assign, teamId]
        );
        if (userToAssignInTeam.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: 'Forbidden: User to assign not in the team' });
        }

        // 4. Delete any existing assignment for this task (if one exists)
        await connection.query('DELETE FROM user_task WHERE task_id = ?', [taskId]);

        // 5. Assign the new user
        await connection.query(
            'INSERT INTO user_task (user_id, task_id) VALUES (?, ?)',
            [user_id_to_assign, taskId]
        );

        await connection.commit();
        res.json({ message: 'Task user updated successfully' });
    } catch (error) {
       // await connection.rollback();
        console.error('Error updating task user:', error);
        if(error.code === 'ER_DUP_ENTRY'){
            res.status(409).json({ message: "User already assigned to task"});
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    } finally {
      //  connection.release();
    }
});

module.exports = app;