// routes/leaveRoutes.js
// Purpose: Define API endpoints for leave operations
// Responsibility: Connect URL paths to controller functions

const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  applyLeave,
  previewImpact,
  getMyLeaves,
  updateLeaveStatus
} = require("../controllers/leaveController");

// POST /api/leaves/apply - Apply for leave (requires authentication)
router.post("/apply", auth, applyLeave);

// POST /api/leaves/preview - Preview impact before applying (requires authentication)
router.post("/preview", auth, previewImpact);

// GET /api/leaves/my - Get user's leave history (requires authentication)
router.get("/my", auth, getMyLeaves);

// PATCH /api/leaves/:id/status - Manager approve/reject leave (requires manager role)
router.patch("/:id/status", auth, roleMiddleware("MANAGER", "ADMIN"), updateLeaveStatus);

module.exports = router;
