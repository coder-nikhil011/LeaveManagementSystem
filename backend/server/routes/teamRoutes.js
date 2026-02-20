// routes/teamRoutes.js
// Purpose: Define API endpoints for team operations
// Responsibility: Connect URL paths to controller functions

const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getMyTeam,
  getTeamMembers,
  getTeamInfo
} = require("../controllers/teamController");

// GET /api/team/my-team - Get authenticated user's team information
router.get("/my-team", auth, getMyTeam);

// GET /api/team/members - Get all members of user's team
router.get("/members", auth, getTeamMembers);

// GET /api/team/info - Get team basic info with statistics
router.get("/info", auth, getTeamInfo);

module.exports = router;
