const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3')(session);
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'campusshare.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS partnership_applications (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  official_email TEXT NOT NULL,
  campus_name TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Review' CHECK(status IN ('Pending Review','Verification','Approved','Rejected')),
  decision_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER,
  action TEXT NOT NULL,
  target_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

// Bootstrap an admin only from environment variables. Never ship default credentials.
const bootstrapUser = process.env.ADMIN_USERNAME;
const bootstrapPassword = process.env.ADMIN_PASSWORD;
if (bootstrapUser && bootstrapPassword) {
  if (bootstrapPassword.length < 12) {
    console.error('ADMIN_PASSWORD must be at least 12 characters. Admin bootstrap skipped.');
  } else {
    const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(bootstrapUser);
    if (!existing) {
      db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')
        .run(bootstrapUser, bcrypt.hashSync(bootstrapPassword, 12));
      console.log(`Bootstrapped admin account: ${bootstrapUser}`);
    }
  }
}

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(session({
  name: 'campusshare.admin.sid',
  secret: process.env.SESSION_SECRET || (IS_PRODUCTION ? undefined : 'local-development-only-change-this-secret'),
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStoreFactory({ db: 'sessions.sqlite', dir: DATA_DIR, concurrentDB: true }),
  cookie: { httpOnly: true, sameSite: 'lax', secure: IS_PRODUCTION, maxAge: 1000 * 60 * 60 * 4 },
}));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' } });
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin && req.session.admin.role === 'admin') return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Admin authentication required.' });
  return res.redirect('/admin-login.html');
}
function audit(adminId, action, targetId = null) {
  db.prepare('INSERT INTO admin_audit_log (admin_id, action, target_id) VALUES (?, ?, ?)').run(adminId, action, targetId);
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'CampusShare', mode: 'prototype' }));
app.get('/admin', (req, res) => req.session?.admin?.role === 'admin'
  ? res.sendFile(path.join(__dirname, 'admin.html'))
  : res.redirect('/admin-login.html'));
app.get('/admin.html', (req, res) => req.session?.admin?.role === 'admin'
  ? res.sendFile(path.join(__dirname, 'admin.html'))
  : res.redirect('/admin-login.html'));

app.post('/api/admin/login', loginLimiter, (req, res, next) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const admin = db.prepare('SELECT id, username, password_hash FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  req.session.regenerate(err => {
    if (err) return next(err);
    req.session.admin = { id: admin.id, username: admin.username, role: 'admin' };
    req.session.save(err2 => {
      if (err2) return next(err2);
      audit(admin.id, 'admin.login');
      res.json({ ok: true, redirect: '/admin' });
    });
  });
});
app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ admin: req.session.admin }));
app.post('/api/admin/logout', requireAdmin, (req, res, next) => {
  audit(req.session.admin.id, 'admin.logout');
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('campusshare.admin.sid');
    res.json({ ok: true, redirect: '/admin-login.html' });
  });
});

// Shared database API. Admin-only list/decision routes are protected server-side.
app.get('/api/admin/partnerships', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT id, reference, official_email, campus_name, provider_name, status, decision_note, created_at, updated_at FROM partnership_applications ORDER BY created_at DESC').all();
  res.json({ applications: rows });
});
app.patch('/api/admin/partnerships/:id', requireAdmin, (req, res) => {
  const status = String(req.body.status || '');
  const note = String(req.body.decisionNote || '').slice(0, 1000);
  if (!['Verification', 'Approved', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const result = db.prepare('UPDATE partnership_applications SET status = ?, decision_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, note, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Application not found.' });
  audit(req.session.admin.id, `partnership.${status.toLowerCase()}`, req.params.id);
  res.json({ ok: true });
});
// Public submission endpoint stores only non-sensitive application metadata; document uploads are not wired to secure object storage yet.
app.post('/api/partnerships', rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false }), (req, res) => {
  const campusName = String(req.body.campusName || '').trim().slice(0, 200);
  const providerName = String(req.body.providerName || '').trim().slice(0, 200);
  const email = String(req.body.officialEmail || '').trim().toLowerCase().slice(0, 254);
  if (!campusName || !providerName || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Campus, provider, and valid official email are required.' });
  const id = require('crypto').randomUUID();
  const reference = `PART-${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`;
  try {
    db.prepare('INSERT INTO partnership_applications (id, reference, official_email, campus_name, provider_name) VALUES (?, ?, ?, ?, ?)').run(id, reference, email, campusName, providerName);
    res.status(201).json({ ok: true, id, reference, status: 'Pending Review' });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'An application with this reference already exists. Please submit again.' });
    throw err;
  }
});
app.get('/api/partnerships/track', (req, res) => {
  const reference = String(req.query.reference || '').trim();
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!reference || !email) return res.status(400).json({ error: 'Reference and email are required.' });
  const row = db.prepare('SELECT reference, official_email, campus_name, provider_name, status, decision_note, created_at, updated_at FROM partnership_applications WHERE reference = ? AND official_email = ?').get(reference, email);
  if (!row) return res.status(404).json({ error: 'No matching application found.' });
  res.json({ application: row });
});

// Do not expose admin.html as a normal static asset. Other legacy frontend pages remain available.
app.use((req, res, next) => {
  if (req.path === '/admin.html') return requireAdmin(req, res, next);
  next();
});
app.use(express.static(__dirname, { index: 'index.html', dotfiles: 'ignore', setHeaders(res, filePath) {
  if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store');
}}));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

if (IS_PRODUCTION && (!process.env.SESSION_SECRET || !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD)) {
  console.error('Production requires SESSION_SECRET, ADMIN_USERNAME, and ADMIN_PASSWORD environment variables.');
  process.exit(1);
}
app.listen(PORT, () => console.log(`CampusShare running on port ${PORT}`));
