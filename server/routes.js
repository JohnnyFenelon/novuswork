import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { q } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!/^\.(jpe?g|png|webp|gif)$/.test(ext)) ext = '.jpg';
    cb(null, `u${req.user.id}-${Date.now()}${ext}`);
  },
});
const uploadPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});
import {
  signSession, setSessionCookie, clearSessionCookie,
  requireAuth, requireAdmin, verifyGoogleIdToken,
} from './auth.js';
import { sendEmail } from './email.js';
import { paypalConfigured, createOrder, captureOrder } from './paypal.js';

const ACTIVATION_PRICE = process.env.ACTIVATION_PRICE || '5.00';
const SUPPORT_INBOX = process.env.CONTACT_TO || 'fenelon.j@gmail.com';

async function fullProfile(user) {
  const out = { user: publicUser(user) };
  if (user.role === 'company') {
    const { rows } = await q('SELECT * FROM company_profiles WHERE user_id=$1', [user.id]);
    out.company = rows[0] || null;
  } else {
    const { rows } = await q('SELECT * FROM worker_profiles WHERE user_id=$1', [user.id]);
    out.profile = rows[0] || null;
    const exp = await q('SELECT * FROM experiences WHERE user_id=$1 ORDER BY id', [user.id]);
    out.experiences = exp.rows;
  }
  return out;
}

function publicUser(u) {
  const { google_sub, ...rest } = u;
  return rest;
}

export function createRoutes(realtime) {
  const r = Router();

  // ── Config for the frontend ─────────────────────────────────────
  r.get('/config', (_req, res) => {
    res.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
      paypalConfigured: paypalConfigured(),
      activationPrice: ACTIVATION_PRICE,
      devLogin: process.env.DEV_LOGIN === 'true',
    });
  });

  // ── Auth ────────────────────────────────────────────────────────
  r.post('/auth/google', async (req, res) => {
    try {
      const { idToken, role } = req.body || {};
      if (!idToken) return res.status(400).json({ error: 'Missing idToken' });
      const g = await verifyGoogleIdToken(idToken);
      let { rows } = await q('SELECT * FROM users WHERE google_sub=$1 OR email=$2', [g.sub, g.email]);
      let user = rows[0];
      if (!user) {
        const wanted = role === 'company' ? 'company' : 'worker';
        ({ rows } = await q(
          `INSERT INTO users (google_sub, email, name, picture, role) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [g.sub, g.email, g.name, g.picture, wanted]
        ));
        user = rows[0];
      } else {
        ({ rows } = await q(
          `UPDATE users SET google_sub=$1, name=COALESCE(NULLIF($2,''), name), picture=COALESCE(NULLIF($3,''), picture), last_seen=NOW() WHERE id=$4 RETURNING *`,
          [g.sub, g.name, g.picture, user.id]
        ));
        user = rows[0];
      }
      if (user.banned) return res.status(403).json({ error: 'This account has been suspended' });
      setSessionCookie(res, signSession(user));
      res.json(await fullProfile(user));
    } catch (e) {
      res.status(401).json({ error: e.message });
    }
  });

  // Dev-only login for testing without Google keys (DEV_LOGIN=true)
  r.post('/auth/dev-login', async (req, res) => {
    if (process.env.DEV_LOGIN !== 'true') return res.status(404).json({ error: 'Not found' });
    const { email, name, role } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Missing email' });
    let { rows } = await q('SELECT * FROM users WHERE email=$1', [email]);
    let user = rows[0];
    if (!user) {
      ({ rows } = await q(
        `INSERT INTO users (email, name, role) VALUES ($1,$2,$3) RETURNING *`,
        [email, name || email.split('@')[0], role === 'company' ? 'company' : 'worker']
      ));
      user = rows[0];
    }
    setSessionCookie(res, signSession(user));
    res.json(await fullProfile(user));
  });

  r.post('/auth/admin', async (req, res) => {
    const { username, password } = req.body || {};
    if (
      username !== (process.env.ADMIN_USER || 'admin') ||
      password !== (process.env.ADMIN_PASS || '1234')
    ) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@novuswork.com';
    let { rows } = await q('SELECT * FROM users WHERE role=$1 AND email=$2', ['admin', adminEmail]);
    let user = rows[0];
    if (!user) {
      ({ rows } = await q(
        `INSERT INTO users (email, name, role, paid, onboarded) VALUES ($1,'Administrator','admin',TRUE,TRUE)
         ON CONFLICT (email) DO UPDATE SET role='admin' RETURNING *`,
        [adminEmail]
      ));
      user = rows[0];
    }
    setSessionCookie(res, signSession(user));
    res.json(await fullProfile(user));
  });

  r.post('/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  r.get('/me', requireAuth, async (req, res) => {
    res.json(await fullProfile(req.user));
  });

  // ── Onboarding / profile ────────────────────────────────────────
  r.put('/me/profile', requireAuth, async (req, res) => {
    const u = req.user;
    const b = req.body || {};
    if (b.phone !== undefined || b.name !== undefined) {
      await q('UPDATE users SET phone=COALESCE($1, phone), name=COALESCE(NULLIF($2,\'\'), name) WHERE id=$3', [
        b.phone ?? null, b.name ?? '', u.id,
      ]);
    }
    if (u.role === 'company') {
      const c = b.company || {};
      await q(
        `INSERT INTO company_profiles (user_id, company_name, website, industry, size, location, description, hiring_roles, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           company_name=$2, website=$3, industry=$4, size=$5, location=$6, description=$7, hiring_roles=$8, updated_at=NOW()`,
        [u.id, c.company_name || '', c.website || '', c.industry || '', c.size || '',
         c.location || '', c.description || '', c.hiring_roles || []]
      );
    } else {
      const p = b.profile || {};
      await q(
        `INSERT INTO worker_profiles (user_id, headline, profession, skills, bio, hourly_rate, job_seeking, availability, years_total, education, languages, location, links, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           headline=$2, profession=$3, skills=$4, bio=$5, hourly_rate=$6, job_seeking=$7,
           availability=$8, years_total=$9, education=$10, languages=$11, location=$12, links=$13, updated_at=NOW()`,
        [u.id, p.headline || '', p.profession || '', p.skills || [], p.bio || '',
         p.hourly_rate || null, p.job_seeking || '', p.availability || '',
         p.years_total || null, p.education || '', p.languages || '', p.location || '',
         JSON.stringify(p.links || {})]
      );
      if (Array.isArray(b.experiences)) {
        await q('DELETE FROM experiences WHERE user_id=$1', [u.id]);
        for (const e of b.experiences) {
          if (!e.title) continue;
          await q(
            'INSERT INTO experiences (user_id, title, company, years, description) VALUES ($1,$2,$3,$4,$5)',
            [u.id, e.title, e.company || '', e.years || '', e.description || '']
          );
        }
      }
    }
    const { rows } = await q('UPDATE users SET onboarded=TRUE WHERE id=$1 RETURNING *', [u.id]);
    res.json(await fullProfile(rows[0]));
  });

  // ── Profile photo upload ────────────────────────────────────────
  r.post('/me/photo', requireAuth, (req, res) => {
    uploadPhoto.single('photo')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
      if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
      const url = `/uploads/${req.file.filename}`;
      // Remove a previous locally-uploaded photo to avoid orphan files.
      if (req.user.picture && req.user.picture.startsWith('/uploads/')) {
        fs.unlink(path.join(UPLOAD_DIR, path.basename(req.user.picture)), () => {});
      }
      const { rows } = await q('UPDATE users SET picture=$1 WHERE id=$2 RETURNING *', [url, req.user.id]);
      res.json(await fullProfile(rows[0]));
    });
  });

  // ── Public profile view ─────────────────────────────────────────
  r.get('/users/:id/profile', requireAuth, async (req, res) => {
    const { rows } = await q('SELECT * FROM users WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    // Candidates cannot view other candidates' profiles.
    if (req.user.role === 'worker' && rows[0].role === 'worker' && rows[0].id !== req.user.id)
      return res.status(403).json({ error: 'Not allowed' });
    res.json(await fullProfile(rows[0]));
  });

  // ── Talent directory (companies & admin only) ───────────────────
  r.get('/talent', requireAuth, async (req, res) => {
    if (req.user.role === 'worker')
      return res.status(403).json({ error: 'Only companies can browse the talent directory' });
    const { category, search } = req.query;
    const params = [];
    let where = `u.role='worker' AND u.onboarded AND NOT u.banned`;
    if (category) { params.push(category); where += ` AND p.profession=$${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (u.name ILIKE $${params.length} OR p.headline ILIKE $${params.length} OR p.job_seeking ILIKE $${params.length} OR array_to_string(p.skills,' ') ILIKE $${params.length})`;
    }
    const { rows } = await q(
      `SELECT u.id, u.name, u.picture, u.paid AS premium, p.headline, p.profession, p.skills, p.hourly_rate, p.location, p.availability, p.job_seeking
       FROM users u JOIN worker_profiles p ON p.user_id=u.id
       WHERE ${where} ORDER BY u.paid DESC, p.updated_at DESC LIMIT 100`, params);
    res.json(rows);
  });

  // ── Jobs ────────────────────────────────────────────────────────
  r.get('/jobs', requireAuth, async (req, res) => {
    const { category, search } = req.query;
    const params = [];
    let where = `j.status='open'`;
    if (category) { params.push(category); where += ` AND j.category=$${params.length}`; }
    if (search) { params.push(`%${search}%`); where += ` AND (j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`; }
    const { rows } = await q(
      `SELECT j.*, COALESCE(c.company_name, u.name) AS company_name,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id=j.id)::int AS applicants
       FROM jobs j JOIN users u ON u.id=j.company_id
       LEFT JOIN company_profiles c ON c.user_id=j.company_id
       WHERE ${where} ORDER BY j.created_at DESC LIMIT 100`, params);
    res.json(rows);
  });

  r.post('/jobs', requireAuth, async (req, res) => {
    if (req.user.role !== 'company' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Only companies can post jobs' });
    const { title, category, description, job_type, budget, location } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const { rows } = await q(
      `INSERT INTO jobs (company_id, title, category, description, job_type, budget, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, title, category || '', description || '', job_type || 'full-time', budget || '', location || 'Remote']
    );
    res.json(rows[0]);
  });

  r.get('/jobs/mine', requireAuth, async (req, res) => {
    const { rows } = await q(
      `SELECT j.*,
        COALESCE((SELECT json_agg(json_build_object(
            'id', a.id, 'status', a.status, 'cover_letter', a.cover_letter, 'created_at', a.created_at,
            'worker_id', w.id, 'worker_name', w.name, 'worker_picture', w.picture,
            'headline', wp.headline, 'profession', wp.profession
          ) ORDER BY a.created_at DESC)
          FROM applications a JOIN users w ON w.id=a.worker_id
          LEFT JOIN worker_profiles wp ON wp.user_id=w.id
          WHERE a.job_id=j.id), '[]') AS applications
       FROM jobs j WHERE j.company_id=$1 ORDER BY j.created_at DESC`, [req.user.id]);
    res.json(rows);
  });

  r.post('/jobs/:id/apply', requireAuth, async (req, res) => {
    if (req.user.role !== 'worker') return res.status(403).json({ error: 'Only job seekers can apply' });
    try {
      const { rows } = await q(
        `INSERT INTO applications (job_id, worker_id, cover_letter) VALUES ($1,$2,$3) RETURNING *`,
        [req.params.id, req.user.id, (req.body?.cover_letter || '').slice(0, 5000)]
      );
      res.json(rows[0]);
    } catch (e) {
      if (String(e.message).includes('unique') || e.code === '23505')
        return res.status(409).json({ error: 'You already applied to this job' });
      throw e;
    }
  });

  r.get('/applications/mine', requireAuth, async (req, res) => {
    const { rows } = await q(
      `SELECT a.*, j.title, j.category, j.location, COALESCE(c.company_name, u.name) AS company_name
       FROM applications a JOIN jobs j ON j.id=a.job_id
       JOIN users u ON u.id=j.company_id
       LEFT JOIN company_profiles c ON c.user_id=j.company_id
       WHERE a.worker_id=$1 ORDER BY a.created_at DESC`, [req.user.id]);
    res.json(rows);
  });

  // ── Messaging ───────────────────────────────────────────────────
  r.get('/messages/threads', requireAuth, async (req, res) => {
    const { rows } = await q(
      `SELECT DISTINCT ON (other.id) other.id, other.name, other.picture, other.role,
              m.body AS last_message, m.created_at AS last_at,
              (SELECT COUNT(*) FROM messages um WHERE um.from_id=other.id AND um.to_id=$1 AND NOT um.read)::int AS unread
       FROM messages m
       JOIN users other ON other.id = CASE WHEN m.from_id=$1 THEN m.to_id ELSE m.from_id END
       WHERE m.from_id=$1 OR m.to_id=$1
       ORDER BY other.id, m.created_at DESC`, [req.user.id]);
    rows.sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
    res.json(rows);
  });

  r.get('/messages/:userId', requireAuth, async (req, res) => {
    const other = Number(req.params.userId);
    const { rows } = await q(
      `SELECT * FROM messages WHERE (from_id=$1 AND to_id=$2) OR (from_id=$2 AND to_id=$1)
       ORDER BY created_at ASC LIMIT 500`, [req.user.id, other]);
    await q('UPDATE messages SET read=TRUE WHERE from_id=$1 AND to_id=$2', [other, req.user.id]);
    res.json(rows);
  });

  r.post('/messages/:userId', requireAuth, async (req, res) => {
    const other = Number(req.params.userId);
    const body = (req.body?.body || '').trim().slice(0, 5000);
    if (!body) return res.status(400).json({ error: 'Empty message' });
    const target = await q('SELECT id FROM users WHERE id=$1 AND NOT banned', [other]);
    if (!target.rows[0]) return res.status(404).json({ error: 'User not found' });
    const { rows } = await q(
      'INSERT INTO messages (from_id, to_id, body) VALUES ($1,$2,$3) RETURNING *', [req.user.id, other, body]);
    realtime.emitToUser(other, 'message', { ...rows[0], from_name: req.user.name, from_picture: req.user.picture });
    res.json(rows[0]);
  });

  // ── Support ─────────────────────────────────────────────────────
  r.post('/support', async (req, res) => {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !phone || !message)
      return res.status(400).json({ error: 'Name, email, phone number and message are required' });
    await q(
      'INSERT INTO support_tickets (name, email, phone, subject, message) VALUES ($1,$2,$3,$4,$5)',
      [name, email, phone, subject || 'Support request', message]
    );
    sendEmail({
      to: SUPPORT_INBOX,
      subject: `[NovusWork Support] ${subject || 'New request'} — ${name}`,
      text: `New support request from novuswork.com\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`,
      replyTo: email,
      replyName: name,
    }).catch(() => {});
    res.json({ ok: true });
  });

  // ── Payments (PayPal, $5 activation) ────────────────────────────
  r.post('/payments/create-order', requireAuth, async (req, res) => {
    try {
      if (!paypalConfigured()) return res.status(503).json({ error: 'Payments are not configured yet' });
      const order = await createOrder(ACTIVATION_PRICE);
      await q(
        'INSERT INTO payments (user_id, paypal_order_id, amount) VALUES ($1,$2,$3)',
        [req.user.id, order.id, ACTIVATION_PRICE]
      );
      res.json({ orderId: order.id });
    } catch (e) {
      console.error('[paypal]', e.message);
      res.status(502).json({ error: 'Could not start PayPal checkout' });
    }
  });

  r.post('/payments/capture', requireAuth, async (req, res) => {
    try {
      const { orderId } = req.body || {};
      if (!orderId) return res.status(400).json({ error: 'Missing orderId' });
      const owned = await q('SELECT id FROM payments WHERE paypal_order_id=$1 AND user_id=$2', [orderId, req.user.id]);
      if (!owned.rows[0]) return res.status(404).json({ error: 'Unknown order' });
      const result = await captureOrder(orderId);
      if (result.status !== 'COMPLETED') return res.status(402).json({ error: `Payment not completed (${result.status})` });
      await q('UPDATE payments SET status=$1 WHERE paypal_order_id=$2', ['completed', orderId]);
      const { rows } = await q('UPDATE users SET paid=TRUE WHERE id=$1 RETURNING *', [req.user.id]);
      res.json(await fullProfile(rows[0]));
    } catch (e) {
      console.error('[paypal]', e.message);
      res.status(502).json({ error: 'Payment capture failed' });
    }
  });

  // ── Admin ───────────────────────────────────────────────────────
  r.get('/admin/stats', requireAuth, requireAdmin, async (_req, res) => {
    const [users, workers, companies, paid, jobs, apps, tickets] = await Promise.all([
      q(`SELECT COUNT(*)::int c FROM users WHERE role<>'admin'`),
      q(`SELECT COUNT(*)::int c FROM users WHERE role='worker'`),
      q(`SELECT COUNT(*)::int c FROM users WHERE role='company'`),
      q(`SELECT COUNT(*)::int c FROM users WHERE paid AND role='worker'`),
      q(`SELECT COUNT(*)::int c FROM jobs`),
      q(`SELECT COUNT(*)::int c FROM applications`),
      q(`SELECT COUNT(*)::int c FROM support_tickets`),
    ]);
    res.json({
      users: users.rows[0].c, workers: workers.rows[0].c, companies: companies.rows[0].c,
      paid: paid.rows[0].c, jobs: jobs.rows[0].c, applications: apps.rows[0].c,
      tickets: tickets.rows[0].c, online: realtime.onlineIds().length,
    });
  });

  r.get('/admin/users', requireAuth, requireAdmin, async (_req, res) => {
    const { rows } = await q(
      `SELECT u.id, u.email, u.name, u.picture, u.phone, u.role, u.paid, u.onboarded, u.banned, u.last_seen, u.created_at,
              p.headline, p.profession, c.company_name
       FROM users u
       LEFT JOIN worker_profiles p ON p.user_id=u.id
       LEFT JOIN company_profiles c ON c.user_id=u.id
       WHERE u.role<>'admin' ORDER BY u.created_at DESC`);
    const online = new Set(realtime.onlineIds());
    res.json(rows.map((u) => ({ ...u, online: online.has(u.id) })));
  });

  r.get('/admin/support', requireAuth, requireAdmin, async (_req, res) => {
    const { rows } = await q('SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 200');
    res.json(rows);
  });

  r.post('/admin/email', requireAuth, requireAdmin, async (req, res) => {
    const { userId, subject, message } = req.body || {};
    const { rows } = await q('SELECT email, name FROM users WHERE id=$1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const ok = await sendEmail({
      to: rows[0].email,
      subject: subject || 'A message from NovusWork',
      text: `Hi ${rows[0].name},\n\n${message}\n\n— NovusWork Team\nDurosier Contact Center · Florida, USA`,
    });
    res.json({ ok });
  });

  r.post('/admin/users', requireAuth, requireAdmin, async (req, res) => {
    const { email, name, phone, role, profession, company_name, premium } = req.body || {};
    if (!email || !name) return res.status(400).json({ error: 'Email and name are required' });
    const wanted = role === 'company' ? 'company' : 'worker';
    try {
      const { rows } = await q(
        `INSERT INTO users (email, name, phone, role, onboarded, paid)
         VALUES ($1,$2,$3,$4,TRUE,$5)
         ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone, role=EXCLUDED.role, onboarded=TRUE
         RETURNING *`,
        [email.toLowerCase().trim(), name, phone || '', wanted, wanted === 'worker' ? Boolean(premium) : false]
      );
      const u = rows[0];
      if (wanted === 'company') {
        await q(
          `INSERT INTO company_profiles (user_id, company_name) VALUES ($1,$2)
           ON CONFLICT (user_id) DO UPDATE SET company_name=EXCLUDED.company_name`,
          [u.id, company_name || name]
        );
      } else {
        await q(
          `INSERT INTO worker_profiles (user_id, profession, headline) VALUES ($1,$2,$3)
           ON CONFLICT (user_id) DO UPDATE SET profession=EXCLUDED.profession`,
          [u.id, profession || '', profession ? `${profession} professional` : '']
        );
      }
      res.json({ id: u.id, ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.post('/admin/users/:id/activate', requireAuth, requireAdmin, async (req, res) => {
    const { rows } = await q('UPDATE users SET paid=NOT paid WHERE id=$1 RETURNING id, paid', [req.params.id]);
    res.json(rows[0]);
  });

  r.post('/admin/users/:id/ban', requireAuth, requireAdmin, async (req, res) => {
    const { rows } = await q('UPDATE users SET banned=NOT banned WHERE id=$1 RETURNING id, banned', [req.params.id]);
    res.json(rows[0]);
  });

  return r;
}
