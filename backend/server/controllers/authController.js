// controllers/authController.js
// Purpose: Handles HTTP request/response for authentication operations
// Responsibility: Read req.body, verify credentials, create JWT, send response
// Does NOT contain business logic - authentication is straightforward
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * User login
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: JWT token and user info
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // Check if user exists in database
    const [rows] = await pool.query(
      "SELECT id, name, email, password, role, team_id FROM users WHERE email = ?",
      [email]
    );

    // If user not found, return error (don't reveal if email exists)
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    // Compare provided password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);

    // If password doesn't match, return error
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token with user information
    // Token expires in 1 day
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        teamId: user.team_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return success response with token and user info (excluding password)
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.team_id,
      },
    });

  } catch (error) {
    // Pass error to error middleware
    next(error);
  }
};
