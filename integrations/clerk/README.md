# Clerk authentication

Server settings: CLERK_ISSUER, CLERK_AUDIENCE, BOOTSTRAP_ADMIN_SUBJECT.

Implementation: backend/app/core/auth.py.

Frontend: NEXT_PUBLIC_AUTH_ENABLED, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and server-only CLERK_SECRET_KEY.

See [integration index](../README.md) and [root setup](../../README.md) for credentials, consent and deployment. Live provider authentication has not yet been verified.
