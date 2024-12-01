const express = require('express');
const {Storage} = require('@google-cloud/storage');
const pool = require('../db'); //Your database connection pool
const multer = require('multer');
const path = require('path');
const app = express();
app.use(express.json());
//const upload = multer({ dest: 'uploads/' });//Temporary storage for multer
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const gcsBucketName = process.env.GCS_BUCKET_NAME; //Your GCS bucket name
const storage = new Storage();
const fs = require('fs');
const createNotification = require('./notifications.js');

// Configure multer for in-memory storage
const upload = multer({
    storage: multer.memoryStorage(), // Use in-memory storage
    limits: {fileSize: 1024 * 1024 * 100} //Example limit of 10MB
});


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

//Upload file to GCS and database
app.post('/api/uploadFile/:teamId', upload.single('file'), async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const teamId = parseInt(req.params.teamId);

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.jpg', '.jpeg', '.png']; //Add other extensions as needed

    if(!allowedExtensions.includes(fileExtension)){
        return res.status(400).json({message: `Invalid file type. Only ${allowedExtensions.join(', ')} are allowed.`});
    }


    try {
        //1.Check if user is part of team.
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if(userInTeam.length === 0){
            return res.status(403).json({ message: 'Forbidden: User not part of this team' });
        }

        // 2. Upload to GCS
        const bucket = storage.bucket(gcsBucketName);
        const gcsFileName = `${teamId}/uploads/${Date.now()}-${req.file.originalname}`;
        const file = bucket.file(gcsFileName);
        const stream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        stream.on('error', (err) => {
            console.error('Error uploading file to GCS:', err);
            res.status(500).json({ message: 'Error uploading file to GCS' });
        });

        stream.on('finish', async () => {
            // 3. Save file metadata to MySQL
            const [result] = await pool.query(
                'INSERT INTO file (filename, original_filename, file_extension, user_id, team_id, gcs_bucket, gcs_path, file_size, content_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [gcsFileName, req.file.originalname, fileExtension, userId, teamId, gcsBucketName, gcsFileName, req.file.size, req.file.mimetype]
            );

            // Fetch the recently uploaded file by ID
            const [recentFile] = await pool.query(
                'SELECT * FROM file WHERE file_id = ?',
                [result.insertId]
            );

        // Create notifications for team members
        const [teamMembers] = await pool.query('SELECT user_id FROM user_team WHERE team_id = ? AND user_id != ?', [teamId, userId]);
        if (teamMembers.length != 0) {
            const recipientUserIds = teamMembers.map(member => member.user_id);

            // Fetch team name using teamId
            const [teamData] = await pool.query('SELECT team_name FROM team WHERE team_id = ?', [teamId]);
            const teamName = teamData[0].team_name; //Extract teamName

            await createNotification(
                teamId,
                'file_upload',
                `${req.file.originalname} uploaded to team ${teamName}`, 
                `/teams/${teamId}/files/${result.insertId}`,
                recipientUserIds
            );
        }

            res.status(201).json({ message: 'File uploaded successfully', file: recentFile[0] });
        });

        stream.end(req.file.buffer);

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        if (req.file && req.file.path) { // Check if req.file.path is defined before attempting to delete
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting temporary file:', err);
            }
        }
    }
});


// API to get a list of all files for a team
app.get('/api/allFiles/:teamId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
    const teamId = parseInt(req.params.teamId);

    try {
        // Authorization check: Verify if the user belongs to the team.
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (userInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: You are not a member of this team.' });
        }

        // Fetch file list from the database
        const [files] = await pool.query(
            'SELECT * FROM file WHERE team_id = ? ORDER BY upload_timestamp DESC',
            [teamId]
        );

        res.json({ files });
    } catch (error) {
        console.error('Error getting files:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.get('/api/downloadFile/:fileId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    
    const fileId = parseInt(req.params.fileId);
    const teamId = parseInt(req.query.teamId); // Read teamId from query parameters

    try {
        //1. Check if file exists and user has access.
        const [fileData] = await pool.query(
            'SELECT * FROM file WHERE file_id = ? AND team_id = ?',
            [fileId, teamId]
        );
        if (fileData.length === 0) {
            return res.status(404).json({ message: 'File not found for this team' });
        }

        // Authorization check: Verify if the user belongs to the team.
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );
        if (userInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: You are not a member of this team.' });
        }

        //2. Download from GCS
        const bucket = storage.bucket(gcsBucketName);
        const file = bucket.file(fileData[0].gcs_path);
        const [metadata] = await file.getMetadata();
        const contentType = metadata.contentType;

        res.set('Content-Type', contentType); 
        res.set('Content-Disposition', `attachment; filename="${fileData[0].original_filename}"`);
        res.set('Access-Control-Expose-Headers', 'Content-Disposition');

        file.createReadStream()
            .on('error', err => {
                console.error('Error downloading file from GCS:', err);
                res.status(500).json({ message: 'Error downloading file' });
            })
            .pipe(res);

    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



// API to delete a file from the database and GCS bucket
app.delete('/api/deleteFiles/:fileId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }

    const fileId = parseInt(req.params.fileId);
    const { teamId } = req.body;

    try {
        // 1. Authorization and file existence check
        const [fileData] = await pool.query(
            'SELECT * FROM file WHERE file_id = ? AND team_id = ?',
            [fileId, teamId]
        );
        if (fileData.length === 0) {
            return res.status(404).json({ message: 'File not found for this team' });
        }

        //Check if the user is authorized to delete the file.
        const [userInTeam] = await pool.query(
            'SELECT 1 FROM user_team WHERE user_id = ? AND team_id = ? AND role = "admin"', //Only admin can delete
            [userId, teamId]
        );
        if (userInTeam.length === 0) {
            return res.status(403).json({ message: 'Forbidden: Only admins can delete files.' });
        }

        // 2. Delete from GCS
        const bucket = storage.bucket(gcsBucketName);
        const file = bucket.file(fileData[0].gcs_path);
        await file.delete();

        // 3. Delete from the database
        await pool.query('DELETE FROM file WHERE file_id = ?', [fileId]);

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        if (error.code === 404) { //GCS specific error code
            res.status(404).json({ message: 'File not found in GCS' });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
});


module.exports = app;