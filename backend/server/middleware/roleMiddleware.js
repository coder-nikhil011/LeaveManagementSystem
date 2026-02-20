// middleware/roleMiddleware.js
// Purpose: Checks if user has required role for accessing protected routes
// Used for manager-only routes and role-based access control

/**
 * Middleware to check if user has required role
 * @param {string[]} allowedRoles - Array of roles that can access the route
 * @returns {Function} Express middleware function
 */
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized - No user found" });
    }

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Forbidden - Insufficient permissions",
        required: allowedRoles,
        current: req.user.role
      });
    }

    // User has required role, proceed to next middleware/controller
    next();
  };
};
