// services/ruleEngine.js
// Purpose: Business logic layer - The BRAIN of the leave management system
// Responsibility: Decide if leave is AUTO_APPROVED, PENDING_MANAGER_REVIEW, or AUTO_REJECTED
// This file contains ALL business rules and core intelligence
// Does NOT send HTTP responses or access req/res objects
// Uses: leaveService for DB operations, workloadService for impact calculation

const leaveService = require("./leaveService");
const { calculateImpact } = require("./workloadService");

/**
 * Evaluate leave request and determine status
 * This is the core decision-making function
 * 
 * @param {number} userId - ID of user requesting leave
 * @param {number} teamId - ID of user's team
 * @param {string} startDate - Leave start date (YYYY-MM-DD)
 * @param {string} endDate - Leave end date (YYYY-MM-DD)
 * @returns {Promise<Object>} Decision object with status and optional reason
 */
exports.evaluateLeave = async (userId, teamId, startDate, endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate date order
  if (end < start) {
    return {
      status: "AUTO_REJECTED",
      reason: "End date cannot be before start date"
    };
  }

  // Reject past leave
  if (start < today) {
    return {
      status: "AUTO_REJECTED",
      reason: "Cannot apply for leave in the past"
    };
  }

  const leaveDays =
    (end - start) / (1000 * 60 * 60 * 24) + 1;

  if (leaveDays > 15) {
    return {
      status: "AUTO_REJECTED",
      reason: "Leave duration exceeds maximum limit of 15 days"
    };
  }

  const teamMemberCount = await leaveService.getTeamMemberCount(teamId);
  const teamLeaveCount = await leaveService.getTeamLeaveCount(teamId, startDate, endDate);

  const teamAbsence = teamMemberCount === 0
    ? 0
    : (teamLeaveCount / teamMemberCount) * 100;

  if (teamAbsence > 50) {
    return {
      status: "AUTO_REJECTED",
      reason: `Team overload: ${teamAbsence.toFixed(1)}% already on leave`
    };
  }

  const impactScore = await calculateImpact(userId, startDate, endDate);

  if (
    leaveDays <= 2 &&
    teamAbsence <= 30 &&
    impactScore < 0.3
  ) {
    return {
      status: "AUTO_APPROVED",
      impactScore: Number(impactScore.toFixed(2)),
      teamAbsence: Number(teamAbsence.toFixed(2))
    };
  }

  if (impactScore > 0.6) {
    return {
      status: "AUTO_REJECTED",
      reason: `High workload impact: ${impactScore.toFixed(2)}`
    };
  }

  return {
    status: "PENDING_MANAGER_REVIEW",
    impactScore: Number(impactScore.toFixed(2)),
    teamAbsence: Number(teamAbsence.toFixed(2))
  };
};