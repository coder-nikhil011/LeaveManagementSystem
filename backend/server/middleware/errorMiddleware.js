// middleware/errorMiddleware.js
// Purpose: Central error handler to prevent app crashes
// Responsibility: Catches all errors, logs them, and returns proper error messages
// Must be the last middleware in app.js

/**
 * Global error handling middleware
 * Catches errors from all routes and controllers
 * Prevents application crashes and provides consistent error responses
 */
module.exports = (err, req, res, next) => {
  // Log error for debugging (in production, use proper logging service)
  console.error("Error:", err);

  // If error has a status code, use it; otherwise default to 500
  const statusCode = err.statusCode || 500;

  // If error has a message, use it; otherwise use generic message
  const message = err.message || "Internal Server Error";

  // Return error response
  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};
