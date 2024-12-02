const pool = require('../db'); // Your database connection pool


const createNotification = async (teamId, type, message, link, recipients) => {
    try {
        const [result] = await pool.query(
            'INSERT INTO notification (team_id, notification_type, message, link) VALUES (?, ?, ?, ?)',
            [teamId, type, message, link]
        );
        const notificationId = result.insertId;
        
        const sql = `INSERT INTO notification_recipients (notification_id, user_id) VALUES ${recipients.map(() => '(?, ?)').join(',')}`;
        const values = recipients.reduce((acc, recipientUserId) => acc.concat([notificationId, recipientUserId]), []);

        await pool.query(sql, values); //Use pool.query directly here

        console.log('Notification created successfully:', notificationId);
        return notificationId;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

module.exports = {createNotification};
