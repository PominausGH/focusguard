const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get tasks for a specific date
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const taskDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE user_id = $1 AND date = $2 
       ORDER BY created_at ASC`,
      [req.userId, taskDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Create task
router.post('/', [body('title').trim().isLength({ min: 1, max: 255 })], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, date, estimatedPomodoros, subtasks, tags } = req.body;
    const taskDate = date
      ? new Date(date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Check task limit (5 per day)
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND date = $2',
      [req.userId, taskDate]
    );

    if (parseInt(countResult.rows[0].count) >= 5) {
      return res.status(400).json({ error: 'Maximum 5 tasks per day' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, date, estimated_pomodoros, subtasks, tags) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        req.userId,
        title,
        taskDate,
        estimatedPomodoros || null,
        subtasks ? JSON.stringify(subtasks) : null,
        tags ? JSON.stringify(tags) : null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed, estimated_pomodoros, subtasks, tags, focus_time } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(completed);
      if (completed) {
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
      } else {
        updates.push(`completed_at = NULL`);
      }
    }
    if (estimated_pomodoros !== undefined) {
      updates.push(`estimated_pomodoros = $${paramCount++}`);
      values.push(estimated_pomodoros);
    }
    if (subtasks !== undefined) {
      updates.push(`subtasks = $${paramCount++}`);
      values.push(JSON.stringify(subtasks));
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramCount++}`);
      values.push(JSON.stringify(tags));
    }
    if (focus_time !== undefined) {
      updates.push(`focus_time = $${paramCount++}`);
      values.push(focus_time);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id, req.userId);

    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} 
       WHERE id = $${paramCount++} AND user_id = $${paramCount} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Add focus time to a task
router.post('/:id/focus', async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return res.status(400).json({ error: 'Minutes must be a positive number' });
    }

    const result = await pool.query(
      `UPDATE tasks SET focus_time = COALESCE(focus_time, 0) + $1 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [minutes, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Add focus time error:', err);
    res.status(500).json({ error: 'Failed to add focus time' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
