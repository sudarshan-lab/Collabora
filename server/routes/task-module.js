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

        //Check if user belongs to the team
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, team_id]
        );
        if(userInTeam.length === 0){
            return res.status(403).json({message: 'Forbidden: User not part of this team'});
        }
        //Check if parent task exists (optional)
        if (parent_task_id) {
            const [parentTaskExists] = await pool.query(
                'SELECT 1 FROM task WHERE task_id = ?',
                [parent_task_id]
            );
            if (parentTaskExists.length === 0) {
                return res.status(400).json({ message: 'Parent task does not exist' });
            }
        }

        const [result] = await pool.query(
            'INSERT INTO task (task_name, task_description, due_date, team_id) VALUES (?, ?, ?, ?)',
            [task_name, task_description, due_date, team_id]
        );
        const taskId = result.insertId;

        // Add subtask relationship if parent_task_id is provided
        if (parent_task_id) {
            await pool.query(
                'INSERT INTO sub_task (task_id, parent_task_id) VALUES (?, ?)',
                [taskId, parent_task_id]
            );
        }

        res.status(201).json({ message: 'Task created successfully', taskId });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
    }
});

// Get all parent tasks for a specific team
app.get('/api/alltasks/:teamId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token); 
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const teamId = parseInt(req.params.teamId);

    try {
        // Check if user belongs to the team
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (userInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: User not part of this team' });
        }

        // Query to fetch only parent tasks
        const [tasks] = await pool.query(`
            SELECT t.*, u.user_id, u.first_name, u.last_name, u.email 
            FROM task t
            LEFT JOIN user_task ut ON t.task_id = ut.task_id
            LEFT JOIN user u ON u.user_id = ut.user_id
            LEFT JOIN sub_task st ON t.task_id = st.task_id
            WHERE t.team_id = ? AND st.parent_task_id IS NULL
        `, [teamId]);

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

// Delete a task and its associated subtasks
app.delete('/api/deleteTask/:taskId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token, res);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const taskId = parseInt(req.params.taskId);

    try {
        // Check if task exists and user has access to delete
        const [taskExists] = await pool.query(
            'SELECT team_id FROM task WHERE task_id = ?',
            [taskId]
        );

        if (taskExists.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const teamId = taskExists[0].team_id;

        // Check if user belongs to the team
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (userInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: User not part of this team' });
        }

        // Function to recursively fetch all descendant task IDs
        const fetchAllDescendantTaskIds = async (parentId) => {
            const [subTasks] = await pool.query(
                'SELECT task_id FROM sub_task WHERE parent_task_id = ?',
                [parentId]
            );
            const descendantIds = [];
            for (const subTask of subTasks) {
                descendantIds.push(subTask.task_id);
                const nestedDescendants = await fetchAllDescendantTaskIds(subTask.task_id);
                descendantIds.push(...nestedDescendants);
            }
            return descendantIds;
        };

        // Fetch all descendant task IDs starting from the provided taskId
        const allTaskIdsToDelete = await fetchAllDescendantTaskIds(taskId);
        allTaskIdsToDelete.push(taskId); 

        // Delete all tasks and subtasks
        await pool.query(
            'DELETE FROM task WHERE task_id IN (?)',
            [allTaskIdsToDelete]
        );

        res.json({ message: 'Task and all associated subtasks deleted successfully' });
    } catch (error) {
        console.error('Error deleting task and subtasks:', error);
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

        // 1. Check if task exists
        const [taskExists] = await pool.query(
            'SELECT team_id FROM task WHERE task_id = ?',
            [taskId]
        );
        if (taskExists.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const teamId = taskExists[0].team_id;


        // 2. Check if the assigning user belongs to the team
        const [assignerInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (assignerInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: Assigning user not in the team' });
        }


        // 3. Check if user to assign belongs to the team
        const [userToAssignInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [user_id_to_assign, teamId]
        );
        if (userToAssignInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: User to assign not in the team' });
        }


        // 4. Assign user to task (insert into user_task)
        await pool.query(
            'INSERT INTO user_task (user_id, task_id) VALUES (?, ?)',
            [user_id_to_assign, taskId]
        );
        await pool.query(
            'UPDATE task SET status = ? WHERE task_id = ?',
            ['open', taskId]
        );
        res.json({ message: 'User assigned to task successfully' });
    } catch (error) {
        console.error('Error assigning user to task:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'User is already assigned to this task' });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    } finally {
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

        // 1. Check if task exists
        const [taskExists] = await pool.query(
            'SELECT team_id FROM task WHERE task_id = ?',
            [taskId]
        );
        if (taskExists.length === 0) {
            await pool.rollback();
            return res.status(404).json({ message: 'Task not found' });
        }
        const teamId = taskExists[0].team_id;

        // 2. Check if the updating user is in the team
        const [updaterInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (updaterInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: Updating user not in the team' });
        }

         // 3. Check if user to assign belongs to the team
        const [userToAssignInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [user_id_to_assign, teamId]
        );
        if (userToAssignInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: User to assign not in the team' });
        }

        // 4. Delete any existing assignment for this task (if one exists)
        await pool.query('DELETE FROM user_task WHERE task_id = ?', [taskId]);

        // 5. Assign the new user
        await pool.query(
            'INSERT INTO user_task (user_id, task_id) VALUES (?, ?)',
            [user_id_to_assign, taskId]
        );
        await pool.query(
            'UPDATE task SET status = ? WHERE task_id = ?',
            ['open', taskId]
        );

        res.json({ message: 'Task user updated successfully' });
    } catch (error) {
        console.error('Error updating task user:', error);
        if(error.code === 'ER_DUP_ENTRY'){
            res.status(409).json({ message: "User already assigned to task"});
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    } finally {
    }
});

// Create a new comment
app.post('/api/addTaskcomment', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const { taskId, content } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Comment content is required' });
    }

    try {
        // Insert the comment into the database
        const [result] = await pool.query(
            'INSERT INTO task_comment (task_id, content, commented_by) VALUES (?, ?, ?)',
            [taskId, content, userId]
        );
        const commentId = result.insertId;

        // Fetch the newly created comment with the specified fields
        const [comment] = await pool.query(
            `SELECT 
                tc.comment_id, 
                tc.content, 
                tc.commented_at, 
                tc.updated_at, 
                u.user_id, 
                u.first_name, 
                u.last_name, 
                u.email 
             FROM task_comment tc
             JOIN user u ON tc.commented_by = u.user_id
             WHERE tc.comment_id = ?`,
            [commentId]
        );

        if (comment.length === 0) {
            return res.status(404).json({ message: 'Failed to retrieve the created comment' });
        }

        res.status(201).json({ message: 'Comment created successfully', comment: comment[0] });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



// Update a comment
app.put('/api/updateTaskComment', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    
    const { taskId, commentId, content } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Comment content is required' });
    }

    try {
        //Check if comment exists and belongs to this task.  Add authorization here if needed.
        const [commentExists] = await pool.query(
            'SELECT 1 FROM task_comment WHERE comment_id = ? AND task_id = ? AND commented_by = ?',
            [commentId, taskId, userId]
        );
        if(commentExists.length === 0){
            return res.status(404).json({ message: 'Comment not found for this task' });
        }


        await pool.query(
            'UPDATE task_comment SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE comment_id = ?',
            [content, commentId]
        );
        res.json({ message: 'Comment updated successfully' });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a comment
app.delete('/api/deleteTaskComment', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const { taskId, commentId} = req.body;

    try {
        //Check if comment exists and belongs to this task. Add authorization if needed.
        const [commentExists] = await pool.query(
            'SELECT 1 FROM task_comment WHERE comment_id = ? AND task_id = ?',
            [commentId, taskId]
        );
        if(commentExists.length === 0){
            return res.status(404).json({ message: 'Comment not found for this task' });
        }

        await pool.query('DELETE FROM task_comment WHERE comment_id = ?', [commentId]);
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all comments for a task
app.get('/api/allTaskcomments', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const { taskId } = req.body;

    try {
        const [comments] = await pool.query(
            'SELECT tc.*, u.first_name, u.last_name, u.email FROM task_comment tc JOIN user u ON tc.commented_by = u.user_id WHERE task_id = ?',
            [taskId]
        );
        res.json({ comments });
    } catch (error) {
        console.error('Error getting comments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get task by ID with task details, subtasks, assigned users, and comments
app.get('/api/task/:taskId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }

    const taskId = parseInt(req.params.taskId);

    try {
        // Check if the task exists
        const [taskExists] = await pool.query(
            `SELECT team_id FROM task WHERE task_id = ?`,
            [taskId]
        );

        if (taskExists.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const teamId = taskExists[0].team_id;

        // Check if the user is part of the team
        const [userInTeam] = await pool.query(
            `SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?`,
            [userId, teamId]
        );

        if (userInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: User not part of this team' });
        }

        // Fetch task details with assigned user details
        const [taskDetails] = await pool.query(
            `
            SELECT 
                t.*, 
                u.user_id, 
                u.first_name, 
                u.last_name, 
                u.email 
            FROM 
                task t
            LEFT JOIN 
                user_task ut 
            ON 
                t.task_id = ut.task_id
            LEFT JOIN 
                user u 
            ON 
                ut.user_id = u.user_id
            WHERE 
                t.task_id = ?
            `,
            [taskId]
        );

        if (taskDetails.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Fetch subtasks with their details and assigned users
        const [subTasks] = await pool.query(
            `
            SELECT 
                st.task_id AS sub_task_id, 
                t.*, 
                u.user_id, 
                u.first_name, 
                u.last_name, 
                u.email 
            FROM 
                sub_task st
            JOIN 
                task t 
            ON 
                st.task_id = t.task_id
            LEFT JOIN 
                user_task ut 
            ON 
                t.task_id = ut.task_id
            LEFT JOIN 
                user u 
            ON 
                ut.user_id = u.user_id
            WHERE 
                st.parent_task_id = ?
            `,
            [taskId]
        );

        // Fetch comments for the main task
        const [taskComments] = await pool.query(
            `
            SELECT 
                tc.comment_id, 
                tc.content, 
                tc.commented_at, 
                tc.updated_at, 
                u.user_id, 
                u.first_name, 
                u.last_name, 
                u.email 
            FROM 
                task_comment tc
            LEFT JOIN 
                user u 
            ON 
                tc.commented_by = u.user_id
            WHERE 
                tc.task_id = ?
            `,
            [taskId]
        );

        // Fetch comments for each subtask
        const subTaskComments = {};
        for (const subTask of subTasks) {
            const [comments] = await pool.query(
                `
                SELECT 
                    tc.comment_id, 
                    tc.content, 
                    tc.commented_at, 
                    tc.updated_at, 
                    u.user_id, 
                    u.first_name, 
                    u.last_name, 
                    u.email 
                FROM 
                    task_comment tc
                LEFT JOIN 
                    user u 
                ON 
                    tc.commented_by = u.user_id
                WHERE 
                    tc.task_id = ?
                `,
                [subTask.sub_task_id]
            );
            subTaskComments[subTask.sub_task_id] = comments;
        }

        // Attach comments to subtasks
        const subtasksWithComments = subTasks.map(subTask => ({
            ...subTask,
            comments: subTaskComments[subTask.sub_task_id] || [],
        }));

        res.json({
            task: {
                ...taskDetails[0],
                comments: taskComments, // Main task comments
            },
            subtasks: subtasksWithComments, // Subtasks with comments
        });
    } catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


module.exports = app;