const mysql = require('mysql2/promise');
require('dotenv').config();



// When deployed on Cloud Run with a Cloud SQL connection attached, set
// INSTANCE_CONNECTION_NAME (project:region:instance) and the driver talks to
// Cloud SQL over the Unix socket at /cloudsql/<name>. Otherwise it falls back
// to a normal TCP host/port connection (local dev or a public IP).
const useSocket = !!process.env.INSTANCE_CONNECTION_NAME;

const pool = mysql.createPool({
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE,
  ...(useSocket
    ? { socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}` }
    : {
        host: process.env.MYSQL_HOST,
        port: process.env.DB_PORT || 3306, // Default port if not specified
      }),
});

(async () => {
  try {
      const connection = await pool.getConnection(); 
      console.log('Connected to the MySQL database!');
      connection.release(); 
  } catch (err) {
      console.error('Error connecting to the database:', err.message);
  }
})();



module.exports = pool;