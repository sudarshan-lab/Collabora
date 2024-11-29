const mysql = require('mysql2/promise');
require('dotenv').config();



const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE,
  port: process.env.DB_PORT || 3306, //Default port if not specified
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