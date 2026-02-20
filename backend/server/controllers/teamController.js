// controllers/teamController.js
// Purpose: Handles HTTP request/response for team-related operations
// Responsibility: Read req.body/req.params, call service functions, send response

const pool = require("../config/db");

/**
 * Get authenticated user's team information
 * GET /api/team/my-team
 */
exports.getMyTeam = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(404).json({ 
        message: "User is not assigned to any team" 
      });
    }

    // Get team basic info
    const [teams] = await pool.query(
      `SELECT id, name, description 
       FROM teams 
       WHERE id = ?`,
      [teamId]
    );

    if (teams.length === 0) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Get team members count
    const [memberCount] = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE team_id = ?",
      [teamId]
    );

    res.json({
      team: teams[0],
      memberCount: memberCount[0].total,
      myUserId: userId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all members of user's team
 * GET /api/team/members
 */
exports.getTeamMembers = async (req, res, next) => {
  try {
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(404).json({ 
        message: "User is not assigned to any team" 
      });
    }

    // Fetch all team members (excluding password)
    const [members] = await pool.query(
      `SELECT id, name, email, role, team_id, created_at
       FROM users
       WHERE team_id = ?
       ORDER BY name ASC`,
      [teamId]
    );

    res.json({
      members,
      count: members.length,
      teamId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get team basic info
 * GET /api/team/info
 */
exports.getTeamInfo = async (req, res, next) => {
  try {
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(404).json({
        message: "User is not assigned to any team"
      });
    }

    const [teams] = await pool.query(
      `SELECT id, name, description, created_at
       FROM teams
       WHERE id = ?`,
      [teamId]
    );

    if (teams.length === 0) {
      return res.status(404).json({ message: "Team not found" });
    }

    const [stats] = await pool.query(
      `SELECT 
         COUNT(DISTINCT u.id) as totalMembers,
         COUNT(DISTINCT CASE 
           WHEN l.status IN ('APPROVED','AUTO_APPROVED')
           AND CURDATE() BETWEEN l.start_date AND l.end_date
           THEN l.id
         END) as activeLeaves
       FROM users u
       LEFT JOIN leaves l ON u.id = l.user_id
       WHERE u.team_id = ?`,
      [teamId]
    );

    res.json({
      team: teams[0],
      statistics: stats[0]
    });

  } catch (error) {
    next(error);
  }
};