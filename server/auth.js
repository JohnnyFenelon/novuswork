import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { q } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE = 'nw_token';

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

export function signSession(user) {
  return jwt.sign(
    { uid: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 3600 * 1000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE);
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/** Express middleware: attaches req.user (full row) or 401s. */
export async function requireAuth(req, res, next) {
  const payload = verifyToken(req.cookies?.[COOKIE]);
  if (!payload) return res.status(401).json({ error: 'Not signed in' });
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [payload.uid]);
  if (!rows[0] || rows[0].banned) return res.status(401).json({ error: 'Account unavailable' });
  req.user = rows[0];
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
}

/** Verify a Google ID token and return { sub, email, name, picture }. */
export async function verifyGoogleIdToken(idToken) {
  if (!googleClient) throw new Error('Google Sign-In is not configured yet');
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const p = ticket.getPayload();
  if (!p?.email || !p.email_verified) throw new Error('Google account email is not verified');
  return { sub: p.sub, email: p.email, name: p.name || '', picture: p.picture || '' };
}
