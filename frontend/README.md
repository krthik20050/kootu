# Frontend

The Next.js website lives here. Driver routes live in `src/app/(driver_app)`; home, passenger and operator routes live in `src/app/(user_app)`. These are Next.js route groups, so the groups do not add path segments: routes remain `/driver`, `/`, `/passenger` and `/admin`. Shared layout and styles stay in `src/app`, reusable UI in `src/components`, and backend calls in `src/lib/api`. Tests live in `tests`.

Run `npm ci`, copy `.env.example` to `.env.local`, fill browser-safe settings and server-only Clerk credentials as described in [root setup](../README.md), then `npm run dev`. Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Do not edit `src/lib/api/generated.ts` manually; regenerate it using `backend/export_contracts.py`. Vercel's project root is `frontend`. Do not put database passwords or provider secrets in this folder's browser code.

Authentication uses dedicated `/sign-in` and `/sign-up` pages with opaque Clerk forms, Google/email options, and allowlisted return destinations for passenger, driver and operator workspaces. The provider sets explicit colors and the global CSS supplies shadcn card/popover/input tokens. Existing Clerk names prefill the passenger name when no saved profile name exists. Run `npx next typegen` before typecheck after moving routes to refresh `.next` generated types.

### Dashboard preview

Visit `/dashboard` for the supplied App1 workspace dashboard: sample statistics, a task chart, project progress and activity. Sidebar navigation works on mobile and desktop, and the search button filters projects. All dashboard data is static sample content, separate from ride records. UI components live in `src/components/ui`, with sample data and navigation in `app-1-utils`. Radix UI, Lucide, CVA and Recharts support the supplied component; Recharts 2.15.4 is pinned for its v2 chart API compatibility.

The dashboard header has a light/dark mode toggle. It follows your system preference until you choose a mode, then remembers that choice in browser storage. The theme covers the chart and mobile sidebar and is scoped to `/dashboard`.

The request workspace uses the dashboard's blue/neutral theme, responsive sidebar and header, and shared light/dark preference. Its chat, ticket upload controls and saved journey list follow the active theme.

The chat composer includes “Record voice”: allow microphone access, record up to 30 seconds, then play back, discard or re-record. Audio remains local and does not fill answers or upload to the backend. Requires a MediaRecorder-capable browser on HTTPS or localhost.
