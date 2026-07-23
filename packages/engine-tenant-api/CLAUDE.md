# engine-tenant-api

Identity, authentication, and project management API.

## Authentication

- **Sign-up** (`SignUpManager`): Create identity + person with email validation, password strength checking, bcrypt hashing
- **Sign-in** (`SignInManager`): Password verification with rate limiting (configurable backoff), OTP/2FA support, creates session API key (default 30min expiry)
- **IDP** (`IDPSignInManager`): OIDC, Facebook, Apple sign-in via `openid-client`. Init → redirect → callback flow with auto sign-up option. Supports RP-initiated (front-channel) Single Logout — `signOut` returns `logoutUrl` for federated sessions. **Claim mapping** (A09, `IDPClaimSyncService`): an IdP's `configuration.claimMapping.rules` maps provider claims to **project memberships** (project role + membership variables) at sign-in and on OIDC session refresh — project memberships only, never global/tenant roles
- **Passwordless** (`PasswordlessSignInManager`): Magic link flow via email tokens with optional MFA
- **API Keys**: Three types (`ApiKeyType` enum) — `SESSION` (short-lived, surfaced as `Identity.sessions`), `PERMANENT` (integrations), `ONE_OFF` (sign-up flows)
- **Email verification & email change** (`EmailVerificationManager`, `EmailChangeManager`): optional per-account e-mail verification at sign-up (`ConfigSignup.requireEmailVerification`) and a confirm-by-token flow for user-initiated address changes (`ConfigEmailChange.requireVerification`)

### Multi-factor authentication

- **TOTP** (`OtpManager`, `OtpAuthenticator`): authenticator-app 2FA — prepare/confirm/disable, surfaced as `Person.otpEnabled`
- **Email OTP** (`EmailOtpManager`): e-mail one-time-password 2FA (`initEmailOtp` / `confirmEmailOtp` / `disableEmailOtp`), surfaced as `Person.emailOtpEnabled` — independent of TOTP, so a UI can show each method separately. Code dispatch is rate-limited per person (`ConfigRateLimits.emailOtpPerPerson`, enabled by default)
- **Backup codes** (`BackupCodeManager`): one-shot recovery codes issued on MFA enrollment; `regenerateBackupCodes` reissues them
- **Auth policies** (`AuthPolicyManager`, `AuthPolicyResolver`): per-role MFA / session policy (global or project-scoped) via `createAuthPolicy` / `updateAuthPolicy` / `deleteAuthPolicy` and the `authPolicies` query. With no rows configured, MFA enforcement is inert. Gated by `system:configure`
- **Login risk / anomaly detection** (`LoginRiskAnalyzer`, A03): opt-in (off by default). Scores each successful login against the person's recent successful logins using trusted-proxy signals (country geo header, user-agent fingerprint, IP/IP-prefix); score thresholds trigger an informational `UNUSUAL_LOGIN` email or step-up email-OTP. Configured under `ConfigLogin.anomalyDetection`
- Admin MFA/session operations: `resetPersonMfa`, `forceSignOutPerson`, `disablePerson`, `revokeSession` (and `Identity.sessions` listing)

## Project & Membership Management

- `ProjectManager`: Create projects with secrets, deploy tokens, and initial admin membership
- `ProjectMemberManager`: Add/update/remove project memberships. SUPER_ADMIN and PROJECT_ADMIN get implicit admin role on all projects.
- `InviteManager`: Invite users by email with configurable password setup method (CREATE_PASSWORD, RESET_PASSWORD, EMAIL_ONLY)

## Read / listing queries

GraphQL read fields whose visibility is enforced per-caller (the resolver returns an empty list rather than throwing when the caller lacks visibility, so batched queries don't abort on one forbidden target):

- **`Query.persons(filter, limit, offset): [Person!]!`** — tenant-wide person listing. SUPER_ADMIN (via `person:list`) lists everyone; otherwise scoped to **exactly the members reachable via `project.members`** — for each project the caller may view, the resolver resolves the visible members through `ProjectMemberManager.getProjectMembers` (which applies per-membership-**role** filtering via `filterMemberships`), then lists only those identities. So a caller whose `tenant.view` ACL rule is restricted to some roles sees only those members (not the whole membership). `filter` matches by email (case-insensitive), `personId`, or `identityId`. Pagination is capped server-side in `PersonsQuery` (default 100, max 1000; negative values clamp to 0) so an unbounded `limit` can't dump the whole table. The listing uses a slim projection (`PersonQueryBuilderFactory.createPersonListQueryBuilder`) that omits `password_hash` / TOTP secrets. Resolver `query/PersonQueryResolver.ts`, model `queries/person/PersonsQuery.ts`.
- **`Project.apiKeys: [ApiKey!]!`** — project-scoped permanent keys (excludes SESSION/ONE_OFF and global keys). Gated by `project.view members` (`PROJECT_VIEW_MEMBER`). Resolver `types/ProjectTypeResolver.ts`, model `queries/apiKey/ApiKeyListQuery.ts` (`ProjectApiKeysQuery`).
- **`Query.globalApiKeys: [ApiKey!]!`** — global permanent keys (identity with no project membership, i.e. from `createGlobalApiKey`). Gated by `apiKey:list` (`API_KEY_LIST`). Resolver `query/ApiKeyQueryResolver.ts`, model `GlobalApiKeysQuery`.
  - The enriched `ApiKey` type carries `description`, `type` (`ApiKeyType`), `enabled`, `createdAt`, `lastUsedAt`, `expiresAt`; mapped in `responseHelpers/ApiKeyResponseFactory.ts`. A key's project memberships (for cloning when re-issuing) are reachable lazily via `apiKey.identity.projects`.
- **`Project.secrets: [ProjectSecretInfo!]!`** — secret KEYS + timestamps only, **never the values**. Gated by `project:viewSecrets` (`PROJECT_VIEW_SECRETS`). Resolver `ProjectTypeResolver.secrets` → `SecretsManager.listSecretKeys` → model `queries/project/ProjectSecretKeysQuery.ts`.
- Also note `Identity.sessions: [SessionInfo!]!` (own sessions always visible; others via `person:viewSessions`) and `Query.authLog` (`system:viewAuthLog`, SUPER_ADMIN only by default).

## Authorization

Tenant-level roles (`Roles.ts`): `LOGIN`, `PERSON`, `SUPER_ADMIN`, `PROJECT_CREATOR`, `PROJECT_ADMIN`, `ENTRYPOINT_DEPLOYER`, `PROJECT_MEMBER`, `SELF`. Permission actions are defined in `PermissionActions.ts` (resource + privilege, some parameterized by `roles` / `memberships`); static grants per role live in `PermissionsFactory.ts`.

- **`SUPER_ADMIN`** gets everything via a single wildcard grant (`resource: ALL, privilege: ALL`), so it implicitly satisfies every action including newly added ones.
- **`PROJECT_ADMIN`** is reached two ways: (a) **per-project**, granted dynamically inside a project scope (`ProjectScope.getIdentityAccess`) when the calling identity's membership in that project includes the project `admin` role — `PROJECT_MEMBER` + `PROJECT_ADMIN` are then unioned into the access node *for that project only*; or (b) as a **global** tenant role held in `identity.roles`, in which case `ProjectMemberManager.getImplicitProjectMemberships` grants implicit project `admin` membership on **all** projects (same as global `SUPER_ADMIN`). Its `roles`-parameterized grants are further constrained by `projectAdminAllowedInputRoles` / `projectAdminUseRolesVerifier` (e.g. it may not act on `super_admin` / `project_creator` roles).
- `LOGIN` / `PERSON` cover the unauthenticated sign-in actions and the self-service actions of a signed-in person, respectively.
- **Custom roles** (`custom_role` table): runtime-defined global roles carrying explicit JSONB grants (`createCustomRole` / `updateCustomRole` / `deleteCustomRole`, gated by `customRole:manage`; listing and the grant-definition catalog via `customRoles` / `customRolePermissions`, gated by `customRole:view`). Assignment reuses `identity.roles`. `CustomRolePermissions.ts` is an explicit fail-closed registry; configured actions compile into the existing `Permissions.allow(..., verifier)` path. Strict action-specific JSON config uses `@contember/typesafe`; role constraints have required `allowed` plus optional `denied`, while immutable code restrictions always protect `super_admin` / `project_creator`. Project/membership actions are absent; mail-template grants are the explicit exception and use exact project/type filters. `CustomRoleAuthorizator` wraps the static authorizator, loads active definitions at most once per request, and shares only that cache with derived identity contexts. Delete tombstones the slug and removes all assignments transactionally. Definition changes audit the canonical before/after grants.

Notable permission actions: `person:list` (`PERSON_LIST`, tenant-wide person listing), `apiKey:list` (`API_KEY_LIST`, global permanent keys), `project:viewSecrets` (`PROJECT_VIEW_SECRETS`, granted to PROJECT_ADMIN + SUPER_ADMIN), `project:viewMembers` (`PROJECT_VIEW_MEMBER`, also gates `project.apiKeys`), `person:viewSessions`, `system:viewAuthLog`, `system:configure`, `customRole:manage` / `customRole:view` (custom role definitions).

## Architecture

CQRS pattern with Command/Query separation via `CommandBus` and `DatabaseQuery`. `TenantContainerFactory` creates `TenantContainer` with all services wired via DIC.

## Key Services

- `ApiKeyManager` — token creation, verification, prolongation. `verifyAndProlong` first consults `UnpersistedApiKeyManager` (configured root tokens, constant-time hash match, no DB row) and only then falls back to the `api_key` table lookup.
- `UnpersistedApiKeyManager` — verifies configured root tokens that are NOT stored in the DB (enables zero-write rotation); built from `tenantCredentials.rootTokens` / `rootTokenHashes`, resolves to a fixed virtual `super_admin` identity (`UNPERSISTED_ROOT_IDENTITY_ID`).
- `OtpManager` / `OtpAuthenticator` — TOTP 2FA setup/confirm/disable
- `EmailOtpManager` — e-mail OTP 2FA (init/confirm/disable); `BackupCodeManager` — MFA recovery codes
- `AuthPolicyManager` (+ `AuthPolicyResolver`) — per-role MFA / session auth policies
- `LoginRiskAnalyzer` — sign-in anomaly scoring (A03); see `RiskWeight` / `RiskAction`
- `AuthLogService` — writes `person_auth_log` audit entries (the `authLog` query reads them). IdP claim mapping (A09) adds the `idp_role_mapped` (before/after membership delta) and `idp_role_mapping_failed` (fail-open marker, no claim values) events, emitted from the resolver on sign-in (`IDPMutationResolver`) and directly from `IdpSessionRevalidator` on OIDC session refresh (the verify hot path, not a GraphQL resolver)
- `IDPClaimSyncService` — A09 claim→membership sync. Evaluates an IdP's `configuration.claimMapping.rules` against the provider claims and grants the resulting **project memberships** (never global roles). `syncPolicy` (`always`/`sticky`) and `unmatched` (`keep`/`remove`, vocabulary-bounded) control reconciliation. Two-layer validation shared with the direct add-member path via schema-utils `MembershipResolver` (config-time in `IDPManager.assertValidClaimMapping`; apply-time fail-closed backstop here). Fail-open on a malformed config; runs at sign-in and on OIDC refresh (`IdpSessionRevalidator`)
- `RateLimiter` — generic per-key rate limiting backed by `rate_limit_event` (per-IP windows, email-OTP-per-person, etc.)
- `EmailVerificationManager` / `EmailChangeManager` — e-mail verification and confirm-by-token address change
- `EmailValidator`, `PasswordStrengthValidator`, `HibpChecker` — input validation (HIBP = haveibeenpwned breach check)
- `PersonAccessManager` — disable person + cascade-invalidate their api keys
- `SecretsManager` — encrypted project secrets (`readSecrets`; `listSecretKeys` for key/timestamp listing without values)
- `ConfigurationManager` — tenant-wide config (signup, email change, password policies, login/backoff, passwordless, captcha, rate limits, anomaly detection)
- `UserMailer` — email notifications with Mustache templates (password reset, invitations, passwordless, email OTP, unusual login, verification)

## Database

Core tables (authoritative list = `snapshot.ts`): `identity`, `person`, `person_mfa` (MFA state incl. `email_otp_enabled` / `otp_activated_at`), `person_backup_code`, `api_key`, `person_token` (password-reset / passwordless / verification tokens), `project`, `project_membership`, `project_membership_variable`, `project_secret`, `identity_provider`, `person_identity_provider`, `idp_session`, `mail_template`, `person_auth_log` (audit log), `auth_policy` (per-role MFA/session policy), `custom_role` (runtime-defined global roles), `rate_limit_event` (anti-abuse rate limiting), `config`.

`Person.emailOtpEnabled` is mapped from `person_mfa.email_otp_enabled`; `Person.otpEnabled` from `person_mfa.otp_activated_at`.

## GraphQL schema (generated)

`src/schema/index.ts` is **generated** from the SDL in `src/schema/tenant.graphql.ts` via graphql-codegen — **do not hand-edit it**. Change the SDL (types, inputs, mutations, enums) and regenerate:

```bash
./scripts/graphql-codegen/run.sh engine-tenant-api
```

The script runs codegen in Docker and writes `src/schema/index.ts`. Its raw output uses semicolons / 2-space indent; the repo style is tabs / no semicolons, so run `bun run format` (dprint) afterwards to normalize the file. When adding a new SDL **type**, codegen also emits its `ResolversTypes` / `ResolversParentTypes` / `*Resolvers` entries — regenerating gets these right; hand-editing tends to miss them.

## Migrations & snapshot

Migrations live in `src/migrations/` (one `YYYY-MM-DD-HHMMSS-name.ts` per change, registered in `runner.ts`). `snapshot.ts` is a `pg_dump` of the schema that running ALL migrations produces — the runner uses it (`SnapshotMigrationResolver`) to bootstrap a fresh DB in one step instead of replaying every migration. **It is generated, not hand-edited, and must be regenerated whenever you add or change a migration**, otherwise a fresh DB drifts from an upgraded one (e.g. a missing index or a non-partial index).

Regenerate (works from any worktree; needs `docker compose up -d postgres` + local `bun install`):

```bash
./scripts/create-migrations-snapshot/run.sh tenant   # or: system
```

The script runs the migrations with local `bun` against the current checkout (so it picks up THIS branch's migrations, not whatever the engine container has mounted), auto-discovers the running postgres container, dumps the schema, and formats the result. Do NOT run migrations inside the `engine` container for this — it mounts the main repo, not your worktree.

Verify the snapshot matches the migrations by bootstrapping two fresh DBs — one with `CONTEMBER_MIGRATIONS_NO_SNAPSHOT=1` (replays migrations), one without (uses the snapshot) — and diffing `pg_dump` of both; they must be schema-identical.
