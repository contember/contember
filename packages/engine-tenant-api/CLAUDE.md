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
