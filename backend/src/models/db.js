const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        settings JSONB DEFAULT '{}'::jsonb
      );

      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        estimated_pomodoros INTEGER,
        subtasks JSONB,
        tags JSONB,
        focus_time INTEGER DEFAULT 0
      );

      -- Focus sessions table
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        preset VARCHAR(20) NOT NULL,
        duration INTEGER NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Analytics table
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        tasks_completed INTEGER DEFAULT 0,
        focus_time INTEGER DEFAULT 0,
        meetings_tracked INTEGER DEFAULT 0,
        meeting_cost DECIMAL(10,2) DEFAULT 0,
        UNIQUE(user_id, date)
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics(user_id, date);
    `);

    // Add columns if they don't exist (for existing databases)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='focus_time') THEN
          ALTER TABLE tasks ADD COLUMN focus_time INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='tags') THEN
          ALTER TABLE tasks ADD COLUMN tags JSONB;
        END IF;
      END $$;
    `);
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };
