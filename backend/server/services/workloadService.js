// services/workloadService.js
// Purpose: Calculate impact score of leave on user's workload
// Responsibility: Check tasks in leave window, calculate total assigned hours, return numeric impact value
// Does NOT send HTTP responses or access req/res objects

const pool = require("../config/db");

/**
 * Calculate impact score of leave on user's workload
 * Impact score = (Total task hours during leave) / (Available working hours)
 * Higher score = higher impact = more likely to be rejected
 * 
 * @param {number} userId - ID of user requesting leave
 * @param {string} startDate - Leave start date (YYYY-MM-DD)
 * @param {string} endDate - Leave end date (YYYY-MM-DD)
 * @returns {Promise<number>} Impact score (0 to infinity, typically 0-1)
 */
exports.calculateImpact = async (userId, startDate, endDate) => {
  // Get all tasks assigned to user that are:
  // - Not completed (status != 'DONE')
  // - Due during the leave period
  const [tasks] = await pool.query(
    `SELECT estimated_hours FROM tasks
     WHERE assigned_to = ?
     AND status != 'DONE'
     AND due_date BETWEEN ? AND ?`,
    [userId, startDate, endDate]
  );

  // Calculate total estimated hours for tasks during leave period
  const totalHours = tasks.reduce(
    (sum, task) => sum + (task.estimated_hours || 0),
    0
  );

  // Calculate leave duration in days
  const leaveDays =
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;

  // Calculate available working hours (assuming 8 hours per day)
  const availableHours = leaveDays * 8;

  // Calculate impact score
  // If no tasks, impact is 0
  // If tasks exceed available hours, impact > 1 (high impact)
  const impactScore = availableHours > 0 ? totalHours / availableHours : 0;

  return impactScore;
};
