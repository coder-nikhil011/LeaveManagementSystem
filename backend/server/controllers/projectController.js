// controllers/projectController.js
// Purpose: Handles HTTP request/response for project-related operations
// Responsibility: Read req data, fetch from DB, send response
// Security: Ensures user can only access projects from their own team

const pool = require("../config/db");

/**
 * Get all projects user is enrolled in
 * GET /api/projects/my-projects
 */
exports.getMyProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const teamId = req.user.teamId;

    // Get projects from user's team OR where user has assigned tasks
    const [projects] = await pool.query(
      `SELECT DISTINCT 
         p.id,
         p.name,
         p.description,
         p.deadline,
         p.status,
         p.created_at
       FROM projects p
       LEFT JOIN tasks t 
         ON p.id = t.project_id AND t.assigned_to = ?
       WHERE p.team_id = ? OR t.assigned_to = ?
       ORDER BY p.deadline ASC`,
      [userId, teamId, userId]
    );

    // Get task statistics for all projects in ONE query (avoids N+1)
    const projectIds = projects.map(p => p.id);

    let taskStatsMap = {};

    if (projectIds.length > 0) {
      const [taskStats] = await pool.query(
        `SELECT 
           project_id,
           COUNT(*) as totalTasks,
           COUNT(CASE WHEN status != 'DONE' THEN 1 END) as pendingTasks,
           SUM(CASE WHEN status != 'DONE' THEN estimated_hours ELSE 0 END) as pendingHours
         FROM tasks
         WHERE assigned_to = ?
         AND project_id IN (?)
         GROUP BY project_id`,
        [userId, projectIds]
      );

      taskStats.forEach(stat => {
        taskStatsMap[stat.project_id] = {
          total: stat.totalTasks,
          pending: stat.pendingTasks,
          pendingHours: stat.pendingHours || 0
        };
      });
    }

    const projectsWithTasks = projects.map(project => ({
      ...project,
      myTasks: taskStatsMap[project.id] || {
        total: 0,
        pending: 0,
        pendingHours: 0
      }
    }));

    res.json({
      projects: projectsWithTasks,
      count: projectsWithTasks.length
    });

  } catch (error) {
    next(error);
  }
};


/**
 * Get upcoming project deadlines
 * GET /api/projects/deadlines
 */
exports.getDeadlines = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const teamId = req.user.teamId;

    const [deadlines] = await pool.query(
      `SELECT 
         p.id as projectId,
         p.name as projectName,
         p.deadline,
         COUNT(t.id) as myTaskCount,
         SUM(CASE WHEN t.status != 'DONE' THEN t.estimated_hours ELSE 0 END) as pendingHours
       FROM projects p
       LEFT JOIN tasks t 
         ON p.id = t.project_id AND t.assigned_to = ?
       WHERE (p.team_id = ? OR t.assigned_to = ?)
       AND p.deadline IS NOT NULL
       AND p.deadline >= CURDATE()
       GROUP BY p.id, p.name, p.deadline
       ORDER BY p.deadline ASC
       LIMIT 10`,
      [userId, teamId, userId]
    );

    res.json({
      deadlines,
      count: deadlines.length
    });

  } catch (error) {
    next(error);
  }
};


/**
 * Get project details by ID
 * GET /api/projects/:id
 */
exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const teamId = req.user.teamId;

    // Fetch project including team_id for security check
    const [projects] = await pool.query(
      `SELECT id, name, description, deadline, status, created_at, team_id
       FROM projects
       WHERE id = ?`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = projects[0];

    // 🔐 SECURITY CHECK
    if (project.team_id !== teamId) {
      return res.status(403).json({
        message: "Access denied: You are not part of this project"
      });
    }

    // Fetch user's tasks in this project
    const [tasks] = await pool.query(
      `SELECT id, title, description, status, estimated_hours, due_date
       FROM tasks
       WHERE project_id = ? AND assigned_to = ?
       ORDER BY due_date ASC`,
      [id, userId]
    );

    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        deadline: project.deadline,
        status: project.status,
        created_at: project.created_at,
        myTasks: tasks
      }
    });

  } catch (error) {
    next(error);
  }
};