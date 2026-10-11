# External API connections

This folder is the starting point for teammates configuring external providers. Each provider folder identifies its purpose, environment variables and implementation location. Server implementations stay inside `backend` so its Python package remains independently deployable.

| Provider | Guide | Purpose |
| --- | --- | --- |
| Clerk | [clerk](clerk/README.md) | User sessions and verified identity |
| Google Maps | [google-maps](google-maps/README.md) | Destination search and road-distance checks |
| Groq | [Groq](groq/README.md) | Ticket suggestions for passenger review |
| Sarvam | [sarvam](sarvam/README.md) | Audio transcription for reviewed ride notes |
| Aviationstack | [aviationstack](aviationstack/README.md) | Automatic flight status and delay updates |

Configure keys in the backend hosting environment; Clerk additionally has frontend settings. Never commit real keys or place server secrets in `NEXT_PUBLIC_` variables. Provider contract tests are in `backend/tests/test_providers.py`; live credentials remain unverified. Database setup belongs to [database](../database/README.md), and hosting setup to the root README.
