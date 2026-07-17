import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'novuswork',
  user: process.env.PGUSER || 'novus',
  password: process.env.PGPASSWORD || '',
});

export const q = (text, params) => pool.query(text, params);

export async function initSchema() {
  await q(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      google_sub    TEXT UNIQUE,
      email         TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL DEFAULT '',
      picture       TEXT NOT NULL DEFAULT '',
      phone         TEXT NOT NULL DEFAULT '',
      role          TEXT NOT NULL DEFAULT 'worker', -- worker | company | admin
      paid          BOOLEAN NOT NULL DEFAULT FALSE,
      onboarded     BOOLEAN NOT NULL DEFAULT FALSE,
      banned        BOOLEAN NOT NULL DEFAULT FALSE,
      last_seen     TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS worker_profiles (
      user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      headline      TEXT NOT NULL DEFAULT '',
      profession    TEXT NOT NULL DEFAULT '',           -- main category
      skills        TEXT[] NOT NULL DEFAULT '{}',
      bio           TEXT NOT NULL DEFAULT '',
      hourly_rate   NUMERIC(8,2),
      job_seeking   TEXT NOT NULL DEFAULT '',           -- what job they want
      availability  TEXT NOT NULL DEFAULT '',           -- full-time | part-time | contract
      years_total   NUMERIC(4,1),
      education     TEXT NOT NULL DEFAULT '',
      languages     TEXT NOT NULL DEFAULT '',
      location      TEXT NOT NULL DEFAULT '',
      links         JSONB NOT NULL DEFAULT '{}'::jsonb, -- portfolio, linkedin...
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title         TEXT NOT NULL,
      company       TEXT NOT NULL DEFAULT '',
      years         TEXT NOT NULL DEFAULT '',
      description   TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS company_profiles (
      user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      company_name  TEXT NOT NULL DEFAULT '',
      website       TEXT NOT NULL DEFAULT '',
      industry      TEXT NOT NULL DEFAULT '',
      size          TEXT NOT NULL DEFAULT '',
      location      TEXT NOT NULL DEFAULT '',
      description   TEXT NOT NULL DEFAULT '',
      hiring_roles  TEXT[] NOT NULL DEFAULT '{}',
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id            SERIAL PRIMARY KEY,
      company_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title         TEXT NOT NULL,
      category      TEXT NOT NULL DEFAULT '',
      description   TEXT NOT NULL DEFAULT '',
      job_type      TEXT NOT NULL DEFAULT 'full-time',  -- full-time | part-time | contract
      budget        TEXT NOT NULL DEFAULT '',
      location      TEXT NOT NULL DEFAULT 'Remote',
      status        TEXT NOT NULL DEFAULT 'open',       -- open | closed
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS applications (
      id            SERIAL PRIMARY KEY,
      job_id        INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      worker_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cover_letter  TEXT NOT NULL DEFAULT '',
      status        TEXT NOT NULL DEFAULT 'pending',    -- pending | accepted | rejected
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (job_id, worker_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id            SERIAL PRIMARY KEY,
      from_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body          TEXT NOT NULL,
      read          BOOLEAN NOT NULL DEFAULT FALSE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages (from_id, to_id, created_at);

    CREATE TABLE IF NOT EXISTS support_tickets (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL,
      phone         TEXT NOT NULL,
      subject       TEXT NOT NULL DEFAULT '',
      message       TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      paypal_order_id TEXT NOT NULL,
      amount          NUMERIC(8,2) NOT NULL,
      currency        TEXT NOT NULL DEFAULT 'USD',
      status          TEXT NOT NULL DEFAULT 'created',  -- created | completed
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
