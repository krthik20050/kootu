# Clerk authentication

Kootu's dedicated app is `app_3KWBNZTTRjtIZHSHZSAgL8Fc6wt`, with development issuer `https://dear-lionfish-4707.clerk.accounts.dev`. Local keys were pulled through the authenticated Clerk CLI; with user approval, publishable/secret keys were saved privately in Vercel Production and Preview. The backend issuer is configured locally and on Render. The RSA JWKS endpoint is reachable. Production-instance migration and signed-in ride testing remain separate work; development keys are used for the hackathon demo.

Server settings: CLERK_ISSUER, CLERK_AUDIENCE, BOOTSTRAP_ADMIN_SUBJECT.

Implementation: backend/app/core/auth.py.

Frontend: NEXT_PUBLIC_AUTH_ENABLED, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and server-only CLERK_SECRET_KEY.

See [integration index](../README.md) and [root setup](../../README.md) for credentials, consent and deployment. Live provider authentication has not yet been verified.
