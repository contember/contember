# engine-tenant-api

Identity, authentication, and project management API.

## Authentication

- **Sign-up** (`SignUpManager`): Create identity + person with email validation, password strength checking, bcrypt hashing
- **Sign-in** (`SignInManager`): Password verification with rate limiting (configurable backoff), OTP/2FA support, creates session API key (default 30min expiry)
- **IDP** (`IDPSignInManager`): OIDC, Facebook, Apple sign-in via `openid-client`. Init → redirect → callback flow with auto sign-up option
- **Passwordless** (`PasswordlessSignInManager`): Magic link flow via email tokens with optional MFA
- **API Keys**: Three types — `SESSION` (short-lived), `PERMANENT` (integrations), `ONE_OFF` (sign-up flows)

## Project & Membership Management

- `ProjectManager`: Create projects with secrets, deploy tokens, and initial admin membership
- `ProjectMemberManager`: Add/update/remove project memberships. SUPER_ADMIN and PROJECT_ADMIN get implicit admin role on all projects.
- `InviteManager`: Invite users by email with configurable password setup method (CREATE_PASSWORD, RESET_PASSWORD, EMAIL_ONLY)

## Authorization

Tenant-level roles: `LOGIN`, `PERSON`, `SUPER_ADMIN`, `PROJECT_CREATOR`, `PROJECT_ADMIN`, `ENTRYPOINT_DEPLOYER`, `PROJECT_MEMBER`, `SELF`. Permission actions defined in `PermissionActions.ts`.

## Architecture

CQRS pattern with Command/Query separation via `CommandBus` and `DatabaseQuery`. `TenantContainerFactory` creates `TenantContainer` with all services wired via DIC.

## Key Services

- `ApiKeyManager` — token creation, verification, prolongation
- `OtpManager` — TOTP 2FA setup/confirm/disable
- `SecretsManager` — encrypted project secrets
- `ConfigurationManager` — tenant-wide config (password policies, login settings, passwordless)
- `UserMailer` — email notifications with Mustache templates (password reset, invitations, passwordless)

## Database

Core tables: `identity`, `person`, `api_key`, `person_token`, `project`, `project_membership`, `project_membership_variable`, `project_secret`, `identity_provider`, `person_identity_provider`, `mail_template`, `person_auth_log`, `config`

## Migrations & snapshot

Migrations live in `src/migrations/` (one `YYYY-MM-DD-HHMMSS-name.ts` per change, registered in `runner.ts`). `snapshot.ts` is a `pg_dump` of the schema that running ALL migrations produces — the runner uses it (`SnapshotMigrationResolver`) to bootstrap a fresh DB in one step instead of replaying every migration. **It is generated, not hand-edited, and must be regenerated whenever you add or change a migration**, otherwise a fresh DB drifts from an upgraded one (e.g. a missing index or a non-partial index).

Regenerate (works from any worktree; needs `docker compose up -d postgres` + local `bun install`):

```bash
./scripts/create-migrations-snapshot/run.sh tenant   # or: system
```

The script runs the migrations with local `bun` against the current checkout (so it picks up THIS branch's migrations, not whatever the engine container has mounted), auto-discovers the running postgres container, dumps the schema, and formats the result. Do NOT run migrations inside the `engine` container for this — it mounts the main repo, not your worktree.

Verify the snapshot matches the migrations by bootstrapping two fresh DBs — one with `CONTEMBER_MIGRATIONS_NO_SNAPSHOT=1` (replays migrations), one without (uses the snapshot) — and diffing `pg_dump` of both; they must be schema-identical.
