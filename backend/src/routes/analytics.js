const express = require('express');
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get analytics summary
router.get('/summary', async (req, res) => {
  try {
    // Get total stats
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE completed = true) as total_tasks_completed,
        COALESCE(SUM(a.focus_time), 0) as total_focus_time,
        COALESCE(SUM(a.meetings_tracked), 0) as total_meetings,
        COALESCE(SUM(a.meeting_cost), 0) as total_meeting_cost
       FROM tasks t
       LEFT JOIN analytics a ON t.user_id = a.user_id
       WHERE t.user_id = $1`,
      [req.userId]
    );

    // Get streak
    const streakResult = await pool.query(
      `WITH daily_activity AS (
        SELECT DISTINCT date::date as activity_date
        FROM tasks
        WHERE user_id = $1 AND completed = true
        ORDER BY activity_date DESC
      ),
      streak AS (
        SELECT activity_date,
               activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::int AS grp
        FROM daily_activity
      )
      SELECT COUNT(*) as current_streak
      FROM streak
      WHERE grp = (SELECT grp FROM streak WHERE activity_date = CURRENT_DATE)`,
      [req.userId]
    );

    // Get focus sessions by preset
    const sessionsResult = await pool.query(
      `SELECT preset, COUNT(*) as count, SUM(duration) as total_duration
       FROM focus_sessions
       WHERE user_id = $1
       GROUP BY preset`,
      [req.userId]
    );

    const sessionsByPreset = {};
    sessionsResult.rows.forEach((row) => {
      sessionsByPreset[row.preset] = {
        count: parseInt(row.count),
        totalDuration: parseInt(row.total_duration),
      };
    });

    res.json({
      tasksCompleted: parseInt(statsResult.rows[0]?.total_tasks_completed || 0),
      totalFocusTime: parseInt(statsResult.rows[0]?.total_focus_time || 0),
      totalMeetings: parseInt(statsResult.rows[0]?.total_meetings || 0),
      totalMeetingCost: parseFloat(statsResult.rows[0]?.total_meeting_cost || 0),
      currentStreak: parseInt(streakResult.rows[0]?.current_streak || 0),
      sessionsByPreset,
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Track focus session
router.post('/focus-session', async (req, res) => {
  try {
    const { taskId, preset, duration } = req.body;

    const result = await pool.query(
      `INSERT INTO focus_sessions (user_id, task_id, preset, duration) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [req.userId, taskId || null, preset, duration]
    );

    // Update daily analytics
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO analytics (user_id, date, focus_time) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET focus_time = analytics.focus_time + $3`,
      [req.userId, today, duration]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Track focus session error:', err);
    res.status(500).json({ error: 'Failed to track focus session' });
  }
});

// Track meeting
router.post('/meeting', async (req, res) => {
  try {
    const { cost, duration } = req.body;

    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO analytics (user_id, date, meetings_tracked, meeting_cost) 
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET 
         meetings_tracked = analytics.meetings_tracked + 1,
         meeting_cost = analytics.meeting_cost + $3`,
      [req.userId, today, cost]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Track meeting error:', err);
    res.status(500).json({ error: 'Failed to track meeting' });
  }
});

// Get recent focus sessions
router.get('/sessions', async (req, res) => {
  try {
    const { limit = 30 } = req.query;

    const result = await pool.query(
      `SELECT fs.*, t.title as task_title
       FROM focus_sessions fs
       LEFT JOIN tasks t ON fs.task_id = t.id
       WHERE fs.user_id = $1
       ORDER BY fs.completed_at DESC
       LIMIT $2`,
      [req.userId, limit]
    );

    res.json(
      result.rows.map((row) => ({
        id: row.id,
        preset: row.preset,
        duration: row.duration,
        completedAt: row.completed_at,
        taskTitle: row.task_title,
      }))
    );
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

module.exports = router;
