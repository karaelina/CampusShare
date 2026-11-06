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
// Render terminates TLS in front of the app and forwards the client IP.
app.set('trust proxy', 1);
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
  application_json TEXT NOT NULL DEFAULT '{}',
  provider_password_hash TEXT,
  provider_activated_at TEXT,
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
CREATE TABLE IF NOT EXISTS provider_equipment (
  provider_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  provider_status TEXT NOT NULL DEFAULT 'Pending',
  provider_name TEXT NOT NULL,
  campus_name TEXT NOT NULL,
  item_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_provider_equipment_status ON provider_equipment(provider_status, updated_at);
`);

// Upgrade databases created by earlier CampusShare builds without resetting data.
for (const [name, definition] of [
  ['application_json', "TEXT NOT NULL DEFAULT '{}'"],
  ['provider_password_hash', 'TEXT'],
  ['provider_activated_at', 'TEXT'],
]) {
  const columns = db.prepare('PRAGMA table_info(partnership_applications)').all();
  if (!columns.some(column => column.name === name)) {
    db.exec(`ALTER TABLE partnership_applications ADD COLUMN ${name} ${definition}`);
  }
}

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
app.use(express.json({ limit: '15mb' }));
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
  const rows = db.prepare('SELECT * FROM partnership_applications ORDER BY created_at DESC').all();
  res.json({ applications: rows.map(row => {
    let detail = {};
    try { detail = JSON.parse(row.application_json || '{}'); } catch {}
    return { ...detail, id: row.id, reference: row.reference, officialEmail: row.official_email,
      campusName: row.campus_name, providerName: row.provider_name, status: detail.status || row.status,
      statusNote: row.decision_note, createdAt: row.created_at, updatedAt: row.updated_at,
      providerAccountStatus: row.provider_activated_at ? 'Activated' : 'Not Activated' };
  }) });
});
app.post('/api/admin/partnerships/sync', requireAdmin, (req, res) => {
  const applications = req.body?.applications;
  if (!Array.isArray(applications) || applications.length > 200) {
    return res.status(400).json({ error: 'A valid partnership list is required.' });
  }
  const upsert = db.prepare(`INSERT INTO partnership_applications
    (id, reference, official_email, campus_name, provider_name, status, decision_note, application_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      reference = excluded.reference, official_email = excluded.official_email,
      campus_name = excluded.campus_name, provider_name = excluded.provider_name,
      status = excluded.status, decision_note = excluded.decision_note,
      application_json = excluded.application_json, updated_at = CURRENT_TIMESTAMP`);
  try {
    const save = db.transaction(rows => {
      let saved = 0;
      for (const row of rows) {
        const id = String(row?.id || '').trim().slice(0, 120);
        const reference = String(row?.reference || id).trim().slice(0, 120);
        const email = String(row?.officialEmail || row?.email || '').trim().toLowerCase().slice(0, 254);
        const campus = String(row?.campusName || '').trim().slice(0, 200);
        const provider = String(row?.providerName || '').trim().slice(0, 200);
        const status = String(row?.status || 'Pending Review');
        if (!id || !reference || !email || !campus || !provider || !['Pending Review','Verification','Approved','Rejected','Inactive'].includes(status)) continue;
        const detail = { ...row, id, reference, officialEmail: email, campusName: campus, providerName: provider };
        delete detail.providerPassword;
        delete detail.password;
        const note = String(row?.statusNote || row?.decisionNote || '').slice(0, 1000);
        upsert.run(id, reference, email, campus, provider, status === 'Inactive' ? 'Rejected' : status, note, JSON.stringify(detail));
        saved += 1;
      }
      return saved;
    });
    const saved = save(applications);
    res.json({ ok: true, saved });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'A partnership email or reference is already in use.' });
    throw error;
  }
});
app.patch('/api/admin/partnerships/:id', requireAdmin, (req, res) => {
  const status = String(req.body.status || '');
  const note = String(req.body.decisionNote || '').slice(0, 1000);
  if (!['Verification', 'Approved', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const current = db.prepare('SELECT application_json FROM partnership_applications WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Application not found.' });
  let detail = {};
  try { detail = JSON.parse(current.application_json || '{}'); } catch {}
  detail.status = status;
  detail.statusNote = note;
  detail.statusUpdatedAt = new Date().toISOString();
  if (status !== 'Approved') {
    db.prepare('UPDATE partnership_applications SET status = ?, decision_note = ?, application_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, note, JSON.stringify(detail), req.params.id);
  } else {
    db.prepare('UPDATE partnership_applications SET status = ?, decision_note = ?, application_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, note, JSON.stringify(detail), req.params.id);
  }
  audit(req.session.admin.id, `partnership.${status.toLowerCase()}`, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/admin/partnerships/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM partnership_applications WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Application not found.' });
  db.prepare('DELETE FROM provider_equipment WHERE provider_id = ?').run(req.params.id);
  audit(req.session.admin.id, 'partnership.removed', req.params.id);
  res.json({ ok: true });
});
// Partnership records are stored on the server so provider approval and listings are shared across devices.
app.post('/api/partnerships', rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false }), (req, res) => {
  const campusName = String(req.body.campusName || '').trim().slice(0, 200);
  const providerName = String(req.body.providerName || '').trim().slice(0, 200);
  const email = String(req.body.officialEmail || '').trim().toLowerCase().slice(0, 254);
  if (!campusName || !providerName || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Campus, provider, and valid official email are required.' });
  const duplicate = db.prepare('SELECT reference FROM partnership_applications WHERE official_email = ?').get(email);
  if (duplicate) return res.status(409).json({ error: 'An application already exists for this official email. Use the tracking option instead.' });
  const documents = req.body.verificationDocuments;
  if (documents && (JSON.stringify(documents).length > 14_000_000
    || !/^data:image\/(png|jpeg|webp);base64,/i.test(String(documents.representativeId?.dataUrl || ''))
    || !/^(data:image\/(png|jpeg|webp);base64,|data:application\/pdf;base64,)/i.test(String(documents.authorizationDocument?.dataUrl || '')))) {
    return res.status(400).json({ error: 'Verification files are missing, unsupported, or too large.' });
  }
  const id = require('crypto').randomUUID();
  const reference = `PART-${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`;
  const application = { ...req.body, id, reference, officialEmail: email, campusName, providerName,
    status: 'Pending Review', statusNote: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  delete application.providerPassword;
  delete application.password;
  try {
    db.prepare('INSERT INTO partnership_applications (id, reference, official_email, campus_name, provider_name, application_json) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, reference, email, campusName, providerName, JSON.stringify(application));
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
  const row = db.prepare('SELECT * FROM partnership_applications WHERE reference = ? AND official_email = ?').get(reference, email);
  if (!row) return res.status(404).json({ error: 'No matching application found.' });
  let detail = {};
  try { detail = JSON.parse(row.application_json || '{}'); } catch {}
  delete detail.verificationDocuments;
  res.json({ application: { ...detail, id: row.id, reference: row.reference, officialEmail: row.official_email,
    campusName: row.campus_name, providerName: row.provider_name, status: detail.status || row.status,
    statusNote: row.decision_note, createdAt: row.created_at, updatedAt: row.updated_at,
    providerAccountStatus: row.provider_activated_at ? 'Activated' : 'Not Activated' } });
});

app.post('/api/provider/activate', loginLimiter, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (password.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters.' });
  const partner = db.prepare('SELECT id, provider_name, campus_name, status, provider_password_hash, provider_activated_at FROM partnership_applications WHERE official_email = ?').get(email);
  if (!partner) return res.status(404).json({ error: 'No provider application was found for this email.' });
  if (partner.status !== 'Approved') return res.status(403).json({ error: 'This partnership has not been approved.' });
  if (partner.provider_activated_at) return res.status(409).json({ error: 'This provider account is already activated. Please log in.' });
  db.prepare('UPDATE partnership_applications SET provider_password_hash = ?, provider_activated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(bcrypt.hashSync(password, 12), partner.id);
  res.json({ ok: true });
});
app.post('/api/provider/login', loginLimiter, (req, res, next) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const partner = db.prepare('SELECT id, provider_name, campus_name, status, provider_password_hash, provider_activated_at FROM partnership_applications WHERE official_email = ?').get(email);
  if (!partner || partner.status !== 'Approved' || !partner.provider_activated_at || !partner.provider_password_hash || !bcrypt.compareSync(password, partner.provider_password_hash)) {
    return res.status(401).json({ error: 'Invalid provider email or password, or the partnership is not approved.' });
  }
  req.session.regenerate(err => {
    if (err) return next(err);
    req.session.provider = { id: partner.id, providerName: partner.provider_name, campusName: partner.campus_name, officialEmail: email };
    req.session.save(err2 => {
      if (err2) return next(err2);
      res.json({ ok: true, provider: req.session.provider });
    });
  });
});
app.get('/api/provider/me', (req, res) => {
  if (!req.session?.provider?.id) return res.status(401).json({ error: 'Provider sign-in required.' });
  const partner = db.prepare('SELECT status, provider_name, campus_name, official_email FROM partnership_applications WHERE id = ?').get(req.session.provider.id);
  if (!partner || partner.status !== 'Approved') return res.status(403).json({ error: 'Provider access is not approved.' });
  res.json({ provider: { id: req.session.provider.id, providerName: partner.provider_name, campusName: partner.campus_name, officialEmail: partner.official_email } });
});
app.post('/api/provider/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('campusshare.admin.sid');
    res.json({ ok: true });
  });
});

const equipmentApiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false });
app.get('/api/equipment', equipmentApiLimiter, (_req, res) => {
  const rows = db.prepare("SELECT e.item_json FROM provider_equipment e JOIN partnership_applications p ON p.id = e.provider_id WHERE p.status = 'Approved' AND e.provider_status = 'Approved' ORDER BY e.updated_at DESC").all();
  const items = rows.flatMap(row => {
    try {
      const item = JSON.parse(row.item_json);
      if (item.isListed === false || ["Unlisted", "Under Review", "Removed"].includes(String(item.listingStatus || item.status || ""))) return [];
      return [{ ...item, providerApproved: true }];
    } catch { return []; }
  });
  res.setHeader('Cache-Control', 'no-store');
  res.json({ items });
});
app.get('/api/provider-equipment/:providerId', equipmentApiLimiter, (req, res) => {
  const providerId = String(req.session?.provider?.id || '');
  if (!providerId || providerId !== String(req.params.providerId || '').trim().slice(0, 120)) {
    return res.status(401).json({ error: 'Provider sign-in required.' });
  }
  const rows = db.prepare('SELECT item_json FROM provider_equipment WHERE provider_id = ? ORDER BY updated_at DESC').all(providerId);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ items: rows.flatMap(row => { try { return [JSON.parse(row.item_json)]; } catch { return []; } }) });
});
app.post('/api/provider-equipment/sync', equipmentApiLimiter, (req, res) => {
  const providerId = String(req.session?.provider?.id || '');
  if (!providerId) return res.status(401).json({ error: 'Provider sign-in required.' });
  const partner = db.prepare('SELECT provider_name, campus_name, status FROM partnership_applications WHERE id = ?').get(providerId);
  if (!partner || partner.status !== 'Approved') return res.status(403).json({ error: 'Only currently approved providers can sync public equipment.' });
  const providerName = partner.provider_name;
  const campusName = partner.campus_name;
  const providerStatus = partner.status;
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length > 100) {
    return res.status(400).json({ error: 'A valid equipment list is required.' });
  }
  const upsert = db.prepare(`INSERT INTO provider_equipment
    (provider_id, item_id, provider_status, provider_name, campus_name, item_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(provider_id, item_id) DO UPDATE SET
      provider_status = excluded.provider_status,
      provider_name = excluded.provider_name,
      campus_name = excluded.campus_name,
      item_json = excluded.item_json,
      updated_at = CURRENT_TIMESTAMP`);
  const saveItems = db.transaction(rows => {
    let saved = 0;
    for (const source of rows) {
      if (!source || typeof source !== 'object') continue;
      const itemId = String(source.id || '').trim().slice(0, 120);
      const name = String(source.name || '').trim().slice(0, 200);
      if (!itemId || !name) continue;
      const item = { ...source, id: itemId, providerId, providerName, campusName };
      const serialized = JSON.stringify(item);
      if (serialized.length > 2_000_000) throw new Error('An equipment photo is too large to sync. Please use an image under 1.4 MB.');
      upsert.run(providerId, itemId, providerStatus, providerName, campusName, serialized);
      saved += 1;
    }
    return saved;
  });
  try {
    const saved = saveItems(items.filter(item => String(item?.providerId || providerId) === providerId));
    res.json({ ok: true, saved });
  } catch (error) {
    if (error instanceof Error && error.message.includes('too large')) return res.status(413).json({ error: error.message });
    throw error;
  }
});

// Do not expose admin.html as a normal static asset. Other legacy frontend pages remain available.
app.use((req, res, next) => {
  if (req.path === '/admin.html') return requireAdmin(req, res, next);
  next();
});
app.use((req, res, next) => {
  if (/^\/(?:server\.js|package(?:-lock)?\.json|render\.yaml|ADMIN_SECURITY_SETUP\.md|UPDATE_NOTES[^/]*|CAMPUSHARE_TEST_CHECKLIST\.txt|data(?:\/|$))/i.test(req.path)) {
    return res.sendStatus(404);
  }
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
