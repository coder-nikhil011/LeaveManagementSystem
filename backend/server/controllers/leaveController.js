// controllers/leaveController.js
// Purpose: Handles HTTP request/response for leave-related operations
// Responsibility: Read req.body/req.params, call service functions, send response
// Does NOT contain business logic - that's in services/
// Flow: Controller → leaveService (DB) + ruleEngine (logic) → Response

const leaveService = require("../services/leaveService");
const ruleEngine = require("../services/ruleEngine");
const { calculateImpact } = require("../services/workloadService");

/**
 * Apply for leave
 * POST /api/leaves/apply
 * Body: { startDate, endDate, reason }
 */
exports.applyLeave = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const teamId = req.user.teamId;
    const { startDate, endDate, reason } = req.body;

    // Basic validation
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ 
        message: "startDate, endDate, and reason are required" 
      });
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        message: "startDate cannot be after endDate"
      });
}
    // 1️⃣ Check for overlapping leave requests
    const overlap = await leaveService.checkOverlap(
      userId,
      startDate,
      endDate
    );

    if (overlap) {
      return res.status(400).json({ 
        message: "You already have an approved or pending leave request in this period" 
      });
    }

    // 2️⃣ Call rule engine to evaluate leave request (business logic)
    const decision = await ruleEngine.evaluateLeave(
      userId,
      teamId,
      startDate,
      endDate
    );

    // 3️⃣ Save leave request to database using leaveService
    const leaveId = await leaveService.createLeave(
      userId,
      teamId,
      startDate,
      endDate,
      reason,
      decision.status
    );

    // Return decision with leave ID
    res.status(201).json({
      ...decision,
      leaveId,
      message: "Leave request submitted successfully"
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview impact of leave before applying
 * POST /api/leaves/preview
 * Body: { startDate, endDate }
 */
exports.previewImpact = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const teamId = req.user.teamId;
    const { startDate, endDate } = req.body;

    // Basic validation
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: "startDate and endDate are required" 
      });
    }

    // Calculate impact score without saving leave
    const impactScore = await calculateImpact(userId, startDate, endDate);

    // Get team availability info using leaveService
    const teamMemberCount = await leaveService.getTeamMemberCount(teamId);
    const teamLeaveCount = await leaveService.getTeamLeaveCount(
      teamId,
      startDate,
      endDate
    );

    const teamAbsence = (teamLeaveCount / teamMemberCount) * 100;
    const leaveDays = 
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;

    // Return preview information
    res.json({
      impactScore: impactScore.toFixed(2),
      leaveDays,
      teamAbsence: teamAbsence.toFixed(2),
      message: "Impact preview calculated"
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's leave history
 * GET /api/leaves/my
 */
exports.getMyLeaves = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all leaves for the authenticated user using leaveService
    const leaves = await leaveService.getLeavesByUser(userId);

    res.json({
      leaves,
      count: leaves.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manager approve/reject leave
 * PATCH /api/leaves/:id/status
 * Body: { status: 'APPROVED' | 'REJECTED', managerNote? }
 * Requires: Manager role
 */
exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, managerNote } = req.body;
    const managerId = req.user.id;

    // Validation
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ 
        message: "status must be 'APPROVED' or 'REJECTED'" 
      });
    }

    // Check if leave exists and get team info using leaveService
    const leave = await leaveService.getLeaveById(id);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Verify manager is from same team (optional check)
    if (leave.team_id !== req.user.teamId) {
      return res.status(403).json({ 
        message: "You can only manage leaves from your own team" 
      });
    }

    // Update leave status using leaveService
    await leaveService.updateLeaveStatus(id, status, managerId, managerNote);

    res.json({
      message: `Leave ${status.toLowerCase()} successfully`,
      leaveId: parseInt(id),
      status
    });
  } catch (error) {
    next(error);
  }
};
