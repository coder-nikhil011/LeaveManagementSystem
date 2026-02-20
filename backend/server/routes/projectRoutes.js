// routes/projectRoutes.js
// Purpose: Define API endpoints for project operations
// Responsibility: Connect URL paths to controller functions

const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getMyProjects,
  getDeadlines,
  getProjectById
} = require("../controllers/projectController");

// GET /api/projects/my-projects - Get all projects user is enrolled in
router.get("/my-projects", auth, getMyProjects);

// GET /api/projects/deadlines - Get upcoming project deadlines
router.get("/deadlines", auth, getDeadlines);

// GET /api/projects/:id - Get project details by ID
router.get("/:id", auth, getProjectById);

module.exports = router;
