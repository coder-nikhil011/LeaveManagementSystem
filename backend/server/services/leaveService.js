// services/leaveService.js
// Purpose: Handles leave-related database operations
// Responsibility: All database queries related to leaves
// Does NOT: Send HTTP responses, use req/res, generate JWT, calculate impact
// Separation: Controllers → leaveService → Database

const pool = require("../config/db");

/**
 * Check if user has overlapping leave requests
 * @param {number} userId - User ID
 * @param {string} startDate - Leave start date
 * @param {string} endDate - Leave end date
 * @returns {Promise<boolean>} True if overlap exists
 */
exports.checkOverlap = async (userId, startDate, endDate) => {
  const [rows] = await pool.query(
    `SELECT id FROM leaves
     WHERE user_id = ?
     AND status IN ('PENDING_MANAGER_REVIEW','AUTO_APPROVED','APPROVED')
     AND (start_date <= ? AND end_date >= ?)`,
    [userId, endDate, startDate]
  );

  return rows.length > 0;
};

/**
 * Insert new leave request into database
 * @param {number} userId - User ID
 * @param {number} teamId - Team ID
 * @param {string} startDate - Leave start date
 * @param {string} endDate - Leave end date
 * @param {string} reason - Leave reason
 * @param {string} status - Leave status (AUTO_APPROVED, AUTO_REJECTED, PENDING_MANAGER_REVIEW)
 * @returns {Promise<number>} Inserted leave ID
 */
exports.createLeave = async (
  userId,
  teamId,
  startDate,
  endDate,
  reason,
  status
) => {
  const [result] = await pool.query(
    `INSERT INTO leaves
     (user_id, team_id, start_date, end_date, reason, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [userId, teamId, startDate, endDate, reason, status]
  );

  return result.insertId;
};

/**
 * Get user's leave history
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of leave records
 */
exports.getLeavesByUser = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, start_date, end_date, status, reason, created_at
     FROM leaves
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
};

/**
 * Update leave status (used by manager)
 * @param {number} leaveId - Leave ID
 * @param {string} status - New status (APPROVED, REJECTED)
 * @param {number} managerId - Manager ID who is updating
 * @param {string} managerNote - Optional note from manager
 * @returns {Promise<void>}
 */
exports.updateLeaveStatus = async (leaveId, status, managerId, managerNote = null) => {
  await pool.query(
    `UPDATE leaves
     SET status = ?, manager_id = ?, manager_note = ?, updated_at = NOW()
     WHERE id = ?`,
    [status, managerId, managerNote, leaveId]
  );
};

/**
 * Get leave by ID with user team info
 * @param {number} leaveId - Leave ID
 * @returns {Promise<Object|null>} Leave record with team_id or null
 */
exports.getLeaveById = async (leaveId) => {
  const [rows] = await pool.query(
    `SELECT l.*, u.team_id 
     FROM leaves l
     JOIN users u ON l.user_id = u.id
     WHERE l.id = ?`,
    [leaveId]
  );

  return rows.length > 0 ? rows[0] : null;
};

/**
 * Count total team members
 * @param {number} teamId - Team ID
 * @returns {Promise<number>} Total team member count
 */
exports.getTeamMemberCount = async (teamId) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as total
     FROM users
     WHERE team_id = ?`,
    [teamId]
  );

  return rows[0].total;
};

/**
 * Count team members on leave during a specific time window
 * @param {number} teamId - Team ID
 * @param {string} startDate - Window start date
 * @param {string} endDate - Window end date
 * @returns {Promise<number>} Count of distinct users on leave
 */
exports.getTeamLeaveCount = async (teamId, startDate, endDate) => {
  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT user_id) as count
     FROM leaves
     WHERE team_id = ?
     AND status IN ('AUTO_APPROVED','APPROVED')
     AND (start_date <= ? AND end_date >= ?)`,
    [teamId, endDate, startDate]
  );

  return rows[0].count;
};
