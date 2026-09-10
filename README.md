# KNS College Website

Website and API for KNS College — a static multi-page site (programmes, admissions, certifications, scholarships, training, online courses) backed by a Node.js/Express API for enquiries, registrations, payments, and scholarship applications.

## Tech Stack

- **Frontend:** Static HTML/CSS/JavaScript (no build step)
- **Backend:** Node.js + Express (`backend/server.js`)
- **Database:** PostgreSQL via Neon (`backend/database/`)
- **Email:** Brevo (Sendinblue) transactional email API
- **Payments:** Monime checkout integration
- **Deployment:** Render

## Prerequisites

- Node.js >= 18
- PostgreSQL database (local or hosted)

## Project Layout

This is a project with shared backend and frontend folders:

- **`backend/`** — the Node.js/Express API server, database code, and database utilities
- **`frontend/`** — the static HTML/CSS/JS site, served by the backend in development/production and deployable on its own as a static site
- **Root directory** — Contains shared configuration files, npm scripts, and environment variables

All commands are run from the project root directory.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env.local` file in the project root (loaded automatically by the server). Key variables:

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | PostgreSQL connection string |
   | `PORT` | Server port (defaults to 3000) |
   | `NODE_ENV` | `development` / `production` |
   | `KNS_ADMIN_API_KEY` | Admin API key for protected endpoints |
   | `PAYMENT_STATUS_SECRET` | Secret used to sign payment status tokens |
   | `MONIME_ACCESS_TOKEN` / `MONIME_SPACE_ID` / `MONIME_API_BASE_URL` / `MONIME_VERSION` | Monime payment gateway config |
   | `MONIME_ALLOWED_CHECKOUT_ORIGINS` | Allowed origins for Monime checkout callbacks |
   | `MONIME_WEBHOOK_SECRET` | Shared secret for verifying `POST /api/webhooks/monime` deliveries (not yet read by the code — the handler currently only logs deliveries while the signature format is confirmed) |
   | `MONIME_REQUIRE_LIVE_TOKEN` | Enforce live (non-test) Monime tokens |
   | `BREVO_API_KEY` / `BREVO_FROM_EMAIL` | Brevo transactional email credentials |
   | `BREVO_TO_EMAIL` / `BREVO_CONTACT_EMAIL` / `BREVO_ENQUIRY_EMAIL` / `BREVO_SCHOLARSHIP_EMAIL` / `BREVO_TRAINING_EMAIL` | Recipient addresses for each form type |
   | `CORS_ORIGIN` | Allowed CORS origin(s) |
   | `DEBUG_CORS` | Enable verbose CORS logging |
   | `PGSSLMODE` / `PG_POOL_MAX` | PostgreSQL SSL mode and connection pool size |
   | `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare R2 (S3-compatible) credentials for uploaded documents |
   | `R2_ENDPOINT` | R2 S3 API endpoint (defaults to `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`) |
   | `R2_BUCKET_PUBLIC` / `R2_BUCKET_PRIVATE` | Bucket names for public (scholarship guide/form) vs private (applicant-submitted) files |
   | `R2_PUBLIC_BASE_URL` | Public bucket's dev/custom domain, used to build direct download links |
   | `R2_SIGNED_URL_TTL_SECONDS` | Lifetime of signed URLs for private-bucket downloads (default `600`) |
   | `FILE_REAP_GRACE_HOURS` | Hours a soft-deleted file waits before permanent cleanup (default `24`) |

3. **Set up the database**
   ```bash
   npm run db:setup
   ```
   This runs the migration (`database/migrate.js`) followed by the seed script (`database/seed.js`). Run them individually with `npm run db:migrate` / `npm run db:seed` if needed.

4. **Run the app**
   ```bash
   npm run dev    # nodemon, auto-restart on changes
   npm start      # production
   ```
   The site is served at `http://localhost:3000`.

## Project Structure

```
├── backend/
│   ├── server.js              # Express API server (entry point)
│   ├── security-helpers.js    # Shared security/validation helpers
│   ├── database/              # PostgreSQL schema, migrations, seed data, queries
│   └── package.json           # Backend dependencies and npm scripts
├── frontend/
│   ├── config.js              # Frontend runtime config (API base URL)
│   ├── images/                # Site imagery
│   ├── *.html                 # Site pages (programmes, admissions, certifications, etc.)
│   ├── *.js                   # Page-specific frontend logic (cart, checkout, chatbot, etc.)
│   └── styles.css             # Global styles
├── scripts/                   # Deployment helper scripts (packages frontend/ for static hosting)
├── scholarships/               # Uploaded scholarship guide/application files (served by the backend)
├── package.json               # Root npm scripts and dependencies
├── .env.local                 # Local environment variables
└── .env.production            # Production environment variables
```

In development and in production, `backend/server.js` serves the frontend folder as static files and provides the API endpoints. The site is available from the one Node process. `frontend/` can also be deployed on its own as a static site elsewhere (see `scripts/prepare-deploy.ps1`), pointed at a separately hosted API.

## Deployment

- **Render:** deploys the project with `backend/server.js` serving both the API and static files
- **Manual/other hosts:** `npm run prepare-deploy` or `powershell -ExecutionPolicy Bypass -File scripts/prepare-deploy.ps1` packages `frontend/` for static hosting

## License

ISC
