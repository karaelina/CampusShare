# CampusShare Server and Render Setup

## What is included
- Express server with an admin-only route for `/admin` and `/admin.html`.
- Admin login uses bcrypt password hashes and server-side sessions stored in SQLite.
- HttpOnly/SameSite session cookie, secure cookie in production, login rate limiting, Helmet headers.
- Admin-only API routes for listing and changing partnership application status.
- Shared SQLite tables for partnership applications, approved provider equipment, admin audit events, and sessions.
- Partnership submissions and admin decisions are shared through the server API.
- Provider activation and sign-in are checked against server-side approval; provider equipment is stored in the shared database and shown to students from the public equipment API.

## Run locally
1. Install Node.js 20 or newer.
2. Open this folder in VS Code terminal.
3. Run `npm install`.
4. Set environment variables before starting:
   - `ADMIN_USERNAME` = your chosen admin username
   - `ADMIN_PASSWORD` = unique password with at least 12 characters
   - `SESSION_SECRET` = long random secret (at least 32 random characters recommended)
   - Optional `DATA_DIR` = persistent writable data folder
5. Start with `npm start` and open `http://localhost:3000/admin`.

PowerShell example (replace the sample values; do not commit them):
```powershell
$env:ADMIN_USERNAME="campusadmin"
$env:ADMIN_PASSWORD="replace-with-a-unique-long-password"
$env:SESSION_SECRET="replace-with-a-long-random-secret"
npm.cmd start
```

## Render deployment
The included `render.yaml` creates a Node web service and mounts `/var/data` as persistent storage for the SQLite database and login sessions. The service uses Render's Starter plan because persistent disks are not available to Free web services. Set a private `ADMIN_USERNAME` and `ADMIN_PASSWORD` during setup; Render generates `SESSION_SECRET`.

## Remaining prototype storage
Equipment listings and partnership approval are shared through the server. Student accounts, rental records, payment demo data, reviews, reports, and inbox messages still use browser `localStorage`; those features do not yet sync across different browsers or devices. Partnership verification files are stored with the database for this prototype. Use sample files only until private file storage, retention controls, and operational backups are added.

## Before production
- Keep the Render disk mounted at `/var/data` and keep `DATA_DIR=/var/data`.
- Use HTTPS; production session cookies require it.
- Never put admin credentials or session secrets in source control.
- Keep the Render service at one instance while using its SQLite disk.
- Add private object storage for verification uploads, CSRF protection, and a backup/restore routine before using real personal documents or payment data.
