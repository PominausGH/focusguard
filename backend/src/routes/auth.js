const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');
const { sendEmail, welcomeEmail } = require('../mailer');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[a-zA-Z]/)
    .matches(/[0-9]/),
  body('displayName').trim().isLength({ min: 2, max: 100 }),
];

const loginValidation = [body('email').isEmail().normalizeEmail(), body('password').notEmpty()];

// Register
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, displayName } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, display_name, created_at, settings`,
      [email, passwordHash, displayName]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const { subject, html } = welcomeEmail(user.display_name);
    sendEmail(user.email, subject, html).catch((err) =>
      console.error('Failed to send welcome email:', err)
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
        settings: user.settings,
      },
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
        settings: user.settings,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, display_name, created_at, settings FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      createdAt: user.created_at,
      settings: user.settings,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update settings
router.patch('/settings', authMiddleware, async (req, res) => {
  try {
    const { settings } = req.body;

    const result = await pool.query(
      `UPDATE users SET settings = settings || $1::jsonb WHERE id = $2 
       RETURNING id, email, display_name, created_at, settings`,
      [JSON.stringify(settings), req.userId]
    );

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      createdAt: user.created_at,
      settings: user.settings,
    });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Delete account: removes the user and everything they own. Requires the
// current password so a leaked/stolen token alone can't wipe an account.
// Deletes child rows explicitly (not just via ON DELETE CASCADE) in case a
// live table predates the cascade constraints.
router.delete(
  '/account',
  authMiddleware,
  [body('password').isString().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Password is required to delete your account' });
    }

    const client = await pool.connect();
    try {
      const found = await client.query('SELECT password_hash FROM users WHERE id = $1', [
        req.userId,
      ]);
      if (found.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const isValid = await bcrypt.compare(req.body.password, found.rows[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      await client.query('BEGIN');
      await client.query('DELETE FROM analytics WHERE user_id = $1', [req.userId]);
      await client.query('DELETE FROM focus_sessions WHERE user_id = $1', [req.userId]);
      await client.query('DELETE FROM tasks WHERE user_id = $1', [req.userId]);
      await client.query('DELETE FROM users WHERE id = $1', [req.userId]);
      await client.query('COMMIT');

      res.json({ deleted: true });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Delete account error:', err);
      res.status(500).json({ error: 'Failed to delete account' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
