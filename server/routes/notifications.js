const pool = require('../db'); // Your database connection pool
const { sendNotificationEmail } = require('../services/email');


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

        // Best-effort email to the same recipients (never blocks/breaks the request).
        try {
            const [rows] = await pool.query(
                'SELECT email FROM user WHERE user_id IN (?)',
                [recipients]
            );
            const emails = rows.map((r) => r.email).filter(Boolean);
            let teamName;
            if (teamId) {
                const [t] = await pool.query('SELECT team_name FROM team WHERE team_id = ?', [teamId]);
                teamName = t[0] && t[0].team_name;
            }
            // fire-and-forget
            sendNotificationEmail(emails, { type, message, link, teamName });
        } catch (mailErr) {
            console.error('Error sending notification emails:', mailErr.message);
        }

        return notificationId;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

module.exports = {createNotification};
