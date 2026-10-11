# Frontend

The current ticket-guided intake is retained at `/passenger` in `src/components/workspace/passenger.tsx` as `Passenger`. `/request` continues to use the local chat UI; both share the updated backend ticket/voice contract. Existing ticket-first interaction checks target the retained component.

The Next.js website lives here. Driver routes live in `src/app/(driver_app)`; home, passenger and operator routes live in `src/app/(user_app)`. These are Next.js route groups, so the groups do not add path segments: routes remain `/driver`, `/`, `/passenger` and `/admin`. Shared layout and styles stay in `src/app`, reusable UI in `src/components`, and backend calls in `src/lib/api`. Tests live in `tests`.

Run `npm ci`, copy `.env.example` to `.env.local`, fill browser-safe settings and server-only Clerk credentials as described in [root setup](../README.md), then `npm run dev`. Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Do not edit `src/lib/api/generated.ts` manually; regenerate it using `backend/export_contracts.py`. Vercel's project root is `frontend`. Do not put database passwords or provider secrets in this folder's browser code.

Authentication uses dedicated `/sign-in` and `/sign-up` pages with opaque Clerk forms, Google/email options, and allowlisted return destinations for passenger, driver and operator workspaces. The provider sets explicit colors and the global CSS supplies shadcn card/popover/input tokens. Existing Clerk names prefill the passenger name when no saved profile name exists. Run `npx next typegen` before typecheck after moving routes to refresh `.next` generated types.

### Passenger dashboard

Visit `/dashboard` for your authenticated passenger dashboard: upcoming rides, ride progress, group passenger counts/departure, assigned vehicle, completed/cancelled history and recent group events. Refresh runs manually and every 15 seconds while visible. Waiting requests can be matched; eligible requests can be cancelled after confirmation. “Edit preview” opens a new request draft prefilled from an owned request; it does not update the original booking. Driver names/contact and pickup instructions are not exposed by the current API and are labelled unavailable. No sample metrics are shown. The original supplied App1 component remains available as source but is no longer mounted at this route.

The dashboard header has a light/dark mode toggle. It follows your system preference until you choose a mode, then remembers that choice in browser storage. The preference is shared with `/request` and applies to cards and mobile navigation.

The request workspace uses the dashboard's white/neutral theme, responsive sidebar and header, and shared light/dark preference. Its chat, ticket upload controls and saved journey list follow the active theme.

The chat uses the existing ticket upload/extraction service (PDF/JPG/PNG up to 20 MB) and the existing voice transcription component in the final review step. Dictation fills editable special instructions and blocks submission while processing. Ticket replacement clears stale flight, timing and destination values. Microphone capture requires a supported browser on HTTPS or localhost; target-device permission and recording behavior still need a human check.

On mobile, the chat uses larger touch targets and a compact composer with camera and voice actions. Tap a completed step or answer bubble to edit it; arrival date has Today/Tomorrow shortcuts using the browser's local date. The conversation scrolls to each new question and respects reduced-motion settings.

Drop-off suggestions appear automatically after 3 typed characters and a 300ms pause. Select a Geoapify result to store its coordinates; keyboard arrows/Enter work too. The authenticated backend `/locations/search` uses Geoapify Address Autocomplete filtered to India, requiring private backend `GEOAPIFY_API_KEY`. Stale search responses are ignored. Manual pin entry remains available.

### Submitting a ride request

The three chat answers now feed POST `/ride-requests`. Final review collects the airport (default COK), pickup-ready time in IST on the selected arrival date, passengers (default 1), bags (default 1), maximum wait (default 30 minutes), optional accessibility/preferences and confirmation. Values remain editable before submission. The frontend maps the address to Geoapify/manual coordinates, converts the confirmed time to ISO UTC, and reuses a UUID for unchanged retries. Success refreshes saved journeys and links to the dashboard. Opening an existing ride creates a new submission draft; it does not update the original, and duplicate active arrivals are rejected. Local voice recordings are not sent as notes.

The dashboard and request page share a white light theme and neutral-gray dark theme with charcoal/white accents.

## Pickup-ready time autofill

The `/request` review looks up landing time using authenticated `GET /flights/arrival?number=AI123&flight_date=YYYY-MM-DD&airport=COK`. Configure private `AVIATIONSTACK_API_KEY` in `backend/.env` and restart the API. Scheduled arrival date is matched in IST; actual, estimated, then scheduled landing times are preferred. Live schedule coverage depends on the provider/plan. Missing timings leave the field editable with a clear message.

Pickup-ready time defaults to landing plus 30 minutes for baggage collection; scanned ticket arrival timestamps can also supply this suggestion. Clock controls adjust by five minutes, preserving the IST pickup date through midnight rollover. Manual typing remains available and manual edits are not overwritten by a pending lookup. Confirm the displayed pickup date/time before submitting. Provider calls retain the current backend rate limits.

## Find a shared ride group

After sending a request in `/request`, the confirmation shows a **Find a group** action. It calls authenticated `POST /ride-requests/{id}/match` without a body and displays the returned group, or the server's waiting/error message. A shared card also appears in Your journeys. It includes group status, departure, passenger/bag counts, drop-off area, vehicle assignment and recent events. **Refresh** reloads saved requests and their authorized `GET /ride-groups/{id}` details; visible-page polling continues every 15 seconds and pauses during actions. `/dashboard` also retains its matching/group controls.

Matching requires compatible passenger requests, eligible vehicles and backend Geoapify road routing configuration (`GEOAPIFY_API_KEY`). Geoapify supplies address suggestions and road estimates. A missing match keeps the request waiting; the UI does not list unrelated passengers or invent sample groups.

## Clock-style pickup picker

Pickup-ready time opens a clock picker built from the installed shadcn Sheet, Button, Input and Label primitives. Select hours/minutes on the dial or type exact values, choose AM/PM, fine-tune by five minutes, then apply. Cancel dismisses changes. A flight-suggestion shortcut restores landing plus 30 minutes when available. The panel shows the pickup date in IST and preserves midnight rollover; it uses a mobile bottom sheet, centered desktop panel and the shared light/dark theme. No new library or API configuration is needed.
