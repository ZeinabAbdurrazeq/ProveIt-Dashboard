# Provelt Admin

Standalone Angular 17 admin dashboard for the Provelt backend.

## Setup

1. Install dependencies inside `admin/`:
   - `npm install`
2. Make sure the backend is running.
3. Start the admin app:
   - `npm start`

The dev server proxies `/api` to `http://localhost:5000` through `proxy.conf.json`.

## Environment

The Angular app uses `src/environments/environment.ts` and `environment.prod.ts`.
Both point the admin API to `/api/admin`.

If your backend runs on a different port in development, update `proxy.conf.json`.

## Backend env variables

Set these in the backend environment:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`

## Notes

- Admin login stores the JWT in `localStorage` under `provelt_admin_token`.
- All protected admin requests send `Authorization: Bearer <token>` automatically.
- The backend admin routes live under `/api/admin`.
