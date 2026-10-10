# Frontend

The Next.js website lives here. Driver routes live in `src/app/(driver_app)`; home, passenger and operator routes live in `src/app/(user_app)`. These are Next.js route groups, so the groups do not add path segments: routes remain `/driver`, `/`, `/passenger` and `/admin`. Shared layout and styles stay in `src/app`, reusable UI in `src/components`, and backend calls in `src/lib/api`. Tests live in `tests`.

Run `npm ci`, copy `.env.example` to `.env.local`, fill browser-safe settings and server-only Clerk credentials as described in [root setup](../README.md), then `npm run dev`. Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Do not edit `src/lib/api/generated.ts` manually; regenerate it using `backend/export_contracts.py`. Vercel's project root is `frontend`. Do not put database passwords or provider secrets in this folder's browser code.
