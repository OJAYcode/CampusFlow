# CampusFlow Frontend

CampusFlow frontend monorepo for two standalone Next.js portals that share the same `src/` implementation:

- `apps/student-portal`
- `apps/staff-portal`

This repo is designed to be deployed as **two separate Vercel projects from one Git repository**.

## Structure

- `apps/student-portal`: student-facing Next.js app
- `apps/staff-portal`: staff-facing Next.js app
- `src/`: shared app features, API clients, UI, and utilities
- `app/globals.css`: shared root stylesheet used by both portals
- `components/`, `hooks/`, `lib/`: small shared root dependencies still used by the live apps

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment values:

```bash
cp .env.example .env.local
```

3. Set the backend URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:10000/api/v1
```

4. Start either portal:

```bash
npm run dev:student
npm run dev:staff
```

## Production deployment on Vercel

Create **two Vercel projects** from this same repo.

### Project 1

- Name: `campusflow-student`
- Root Directory: `apps/student-portal`
- Framework Preset: `Next.js`

### Project 2

- Name: `campusflow-staff`
- Root Directory: `apps/staff-portal`
- Framework Preset: `Next.js`

### Recommended domains

- `student.yourdomain.com` -> student portal
- `staff.yourdomain.com` -> staff portal

### Environment variables for both projects

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain/api/v1
```

If you add extra frontend env vars later, keep them aligned across both Vercel projects when they are shared.

## Suggested backend CORS

Allow both deployed frontend origins:

- `https://student.yourdomain.com`
- `https://staff.yourdomain.com`

## Build verification

The current repo layout has been verified with:

```bash
npm run build:student
npm run build:staff
```

## Notes

- The student and staff portals are intentionally separate deploy targets.
- Do not deploy the repo as one single Vercel frontend project at the root unless you plan to merge both apps back into one routing surface.
