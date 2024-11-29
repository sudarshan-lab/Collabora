const express = require('express');
//require('dotenv').config();
require('dotenv').config({ path: '.production.env' })
const mysql = require('mysql2/promise');



const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE,
  port: process.env.DB_PORT || 3306, //Default port if not specified
};

/* const dbConfig = {
  host: process.production.env.MYSQL_HOST,
  user: process.production.env.MYSQL_USER,
  password: process.production.env.MYSQL_PASSWORD || '',
  database: process.production.env.MYSQL_DATABASE,
  port: process.production.env.DB_PORT || 3306, //Default port if not specified
}; */

async function connect() {
  try {
    const connection = await mysql.createConnection(dbConfig).then(console.log("connected"));
    return connection;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
}

module.exports = { connect };
