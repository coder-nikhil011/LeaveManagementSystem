// config/db.js

const mysql = require("mysql2/promise");

// Create connection pool using XAMPP credentials
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",              // XAMPP default
  database: "leave_management",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Connected Successfully to leave_management");
    connection.release();
  } catch (error) {
    console.error("❌ MySQL Connection Failed:", error.message);
    process.exit(1);
  }
}

testConnection();

module.exports = pool;