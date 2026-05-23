# Team Task Manager

Production-grade task management app with authentication, Admin/Member roles, project and team management, task assignment, and progress tracking.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Custom JWT auth with http-only cookies
- Zod validation

## Features

- Signup and login
- Admin and Member role handling
- Project creation and team membership
- Task creation, assignment, and status updates
- Dashboard metrics for completion and overdue work
- REST APIs for auth, projects, tasks, and dashboard data

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and set:

- `DATABASE_URL`
- `AUTH_SECRET`

3. Push the Prisma schema and generate the client:

```bash
npm run db:push
```

4. Load demo data:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

If you skip `DATABASE_URL` in development, the app falls back to an in-memory demo store for quick UI testing.

## Demo Accounts

After seeding a real database, use:

- Admin: `admin@teamtask.local` / `Admin1234!`
- Member: `member@teamtask.local` / `Member1234!`

## Railway Deployment

1. Create a PostgreSQL database in Railway.
2. Set Railway environment variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NODE_ENV=production`

3. Railway will read `nixpacks.toml` automatically for the build/start commands.
4. Deploy the app folder in this workspace.
5. Run `npm run db:push` after the first deploy to sync Prisma to the Railway database.
6. Optional: run `npm run db:seed` once if you want demo data in the deployed database.

Production does not use the in-memory fallback, so `DATABASE_URL` is required.

### GitHub Actions DB init

If you use the manual workflow in `.github/workflows/init-db.yml`, add these repository secrets:

- `DATABASE_URL` should be the external Railway PostgreSQL connection string, not the `postgres.railway.internal` host.
- `AUTH_SECRET` is optional for the seed job unless you add code that needs it.

If you stored `DATABASE_URL` in a GitHub Environment instead of repo secrets, select that Environment when running the workflow. The workflow now reads the Environment you choose at dispatch time.

Then open GitHub Actions, select `Init DB`, and run the workflow on the branch you want to initialize.

If the secret is empty, the workflow stops immediately with a clear error message.

### Deployment checklist

- Confirm `DATABASE_URL` points to the Railway Postgres service.
- Confirm `AUTH_SECRET` is a long random value.
- Confirm `NODE_ENV=production` is set in Railway.
- Confirm the app builds locally with `npm run build` before deployment.
- Confirm demo accounts are only used on seeded/dev databases.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/dashboard`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `POST /api/projects/:projectId/members`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`

## Notes

- The first Admin account can be created from signup. Later signups are automatically downgraded to Member if an Admin already exists.
- The dashboard is server-rendered, while create/update actions go through REST APIs for a smoother experience.
- The signup flow is available at both `/signup` and `/api/auth/signup` for compatibility.
