# CampusShare Admin Security — Phase 1 foundation

## What is included
- Express server with an admin-only route for `/admin` and `/admin.html`.
- Admin login uses bcrypt password hashes and server-side sessions stored in SQLite.
- HttpOnly/SameSite session cookie, secure cookie in production, login rate limiting, Helmet headers.
- Admin-only API routes for listing and changing partnership application status.
- Shared SQLite tables for partnership metadata and admin audit events.
- Public partnership submission and status tracking API endpoints (metadata only).

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

## Important integration status
This is a security/backend foundation, not a completed production integration. The legacy student/provider/admin frontend currently uses `localStorage`. The partnership form and existing admin dashboard still need to be wired to these APIs before submissions sync across devices. Uploaded ID/authorization documents are NOT stored by these APIs; secure object storage, server-side file validation, private access rules, and retention policy must be implemented before handling real documents. Do not upload real IDs or payment data in this prototype.

## Before production
- Configure a persistent disk/volume for `DATA_DIR` (SQLite data must persist across deploys).
- Set all required environment variables in the hosting provider's secret settings.
- Use HTTPS; production session cookies require it.
- Do not expose admin bootstrap credentials in source control.
- Integrate the existing forms/dashboard with APIs and test all authorization cases.
- Add CSRF protection and a deliberate backup/restore strategy before handling real user data.
