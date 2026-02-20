// server.js
// Purpose: Entry point of the application
// Responsibility: Loads environment variables, starts HTTP server

// Load environment variables from .env file
require("dotenv").config();

// Import Express app configuration
const app = require("./app");

// Get port from environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// Start server and listen on specified port
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API endpoints available at http://localhost:${PORT}/api`);
});
