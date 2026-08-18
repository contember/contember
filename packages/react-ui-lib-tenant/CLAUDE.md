# react-ui-lib-tenant

Ready-made admin UI for **tenant management** — a full tenant dashboard: sign-in, self-service account settings (profile, 2FA, backup codes, passwordless, sessions), project members, API keys, tenant-wide person administration, and project secrets. Styled components built on the `@contember/react-ui-lib-base` primitives (shadcn-style), wired to `react-client-tenant` query hooks and the form context from `react-identity`.

## Listings (`listing/`)

- `MemberList` — the base project-members table (pagination, refresh, delete, edit-roles dialog). Parameterized by `tableHeaders` / `tableColumns`.
- `PersonList`, `ApiKeyList` — project-scoped listings. `PersonList` specializes `MemberList` by `memberType: 'PERSON'`; `ApiKeyList` is its own component on `useProjectApiKeysQuery` (roles, status, created/last-used/expiry, disable action).
- `PersonsList` — tenant-wide person listing (`usePersonsQuery`) with an email filter, pagination, roles, MFA column, a disabled-state column, row actions (`person-actions.tsx`), and an `onSelectPerson` callback for opening `PersonDetail`.
- `PersonDetail` — admin view of a single person: profile, password, MFA state + reset, global roles, sessions, connected identity providers. The host app owns the surrounding layout (e.g. a dialog opened from `PersonsList`'s `onSelectPerson`).
- `person-actions.tsx` — `DisablePersonAction`, `EnablePersonAction`, `ForceSignOutPersonAction`, `ResetPersonMfaAction`: confirm-dialog buttons, each wrapping the matching `react-client-tenant` trigger.
- `AuthLogList` — the authentication audit log (`useAuthLogQuery`): type/success/person filters, pagination.
- `GlobalApiKeyList` — global permanent keys (`useGlobalApiKeysQuery`) with a disable action.
- `ProjectSecretList` — secret keys + timestamps (`useProjectSecretsQuery`); never values.
- `MemberDeleteDialog`, `MfaBadges` — shared building blocks (`MfaBadges` renders the TOTP / email-OTP state).

## Forms (`forms/`)

- `common.tsx` — `TenantFormField` / `TenantFormError` / `TenantFormLabel` / `TenantFormInput`, generic over a `FormContextValue`.
- Field components: `InviteFormFields` (with `allowUnmanaged` for the no-mail path — must be paired with `allowUnmanaged` on `InviteForm`, which throws on submit if it is not), `SignUpFormFields`, `CreateApiKeyFormFields`, `CreateGlobalApiKeyFormFields`, `UpdateProjectMemberFormFields`, `AddProjectMemberFormFields`, `ChangeMyProfileFormFields`, `ChangeProfileFormFields`, `SetPersonPasswordFormFields`, `SetProjectSecretFormFields`, plus auth forms (`login`, `password-reset`, `verify-email`, passwordless variants incl. the backup-code fallback field, …).
- `GlobalRolesControl` — add/remove tenant-wide (global) roles on an identity; free-text role input since the API can't enumerate configured roles.
- `MembershipsControl` — role/variable picker, with `useIntrospectionRolesConfig(projectSlug)` resolving roles from the project schema.

Field components read their form state via a `useXForm()` hook — the **provider** for that form (e.g. `CreateGlobalApiKeyForm`) lives in `react-client-tenant` and is re-exported through `react-identity` / `interface`. A consumer wraps the fields in the provider and handles `onSuccess`.

## Self-service (`security/`, `otp/`)

- `security/` — `SessionList` (own sessions with `personId` omitted, or an admin view of another person's with `personId` set; revoke action), `PasswordlessToggle` (enable/disable passwordless sign-in for self).
- `otp/` — `OtpSetup` (TOTP enroll / disable flow, QR code), `EmailOtpSetup` (e-mail OTP enroll / disable), `BackupCodes` / `BackupCodesDisplay` (regenerate recovery codes; `BackupCodesDisplay` shows a freshly issued code set once — it is never retrievable again after that).

## Configuration, read-only (`config/`)

`TenantConfigView`, `AuthPolicyList`, `IdentityProviderList`, `MailTemplateList` — display-only views over the four configuration queries. There is no editing counterpart by design; `ManagedByCliNote` points at `contember tenant:apply` instead.

Two things differ from the listings:

- **These resolvers throw instead of returning empty.** `renderConfigQueryState` (`config/common.tsx`) uses `isForbiddenError` from `react-client-tenant` to render "no permission" as an ordinary state, so a non-admin does not get a red error box on a page that simply is not theirs.
- **`renderConfigQueryState` is a helper, not a component** — the caller `return`s its result and then narrows on `'data' in query`. Deliberately lowercase.

`IdentityProviderList` renders `configuration` behind a toggle. It arrives already filtered by `IdentityProviderHandler.getPublicConfiguration` (built-in oidc/apple/facebook strip the client secret); a third-party handler that omits the method returns the raw blob, which is why the view warns rather than promising safety.

## Other

- `idp/` — `IdentityProviderConnections` (own connected external IdPs, disconnect action).
- `hooks/` — `useInvite`, `useInviteUser`.

## Conventions

- **Data**: `useTenantQueryLoader(useXQuery(), variables)`, then `switch (query.state)` over `loading | refreshing | success | error`. Project-scoped lists read the slug via `useProjectSlug()`.
- **i18n**: a single static `dict.ts` (no message formatter). Components read `dict.tenant.*`; add new strings there.
- **Error messages**: `dict.tenant.commonErrorMessages` covers the codes any form or action can raise (`UNKNOWN_ERROR`, `FORBIDDEN`). `TenantFormError` falls back to it, so a per-form `errorMessages` map does not have to list them; a one-shot action passes its `onError` code through `actionErrorMessage` (`errors.ts`) instead. Do not paper a denial over with the generic "failed" line — the user cannot retry their way out of one.
- **UI primitives** come from `@contember/react-ui-lib-base`; icons from `lucide-react`. Styling is Tailwind utility classes inline.
- **`useTenantQueryLoader` memoizes variables only one level deep** (`useObjectMemo`, plain `!==` per key) — a nested object (e.g. `AuthLogList`'s `filter`) must be `useMemo`'d by the caller, or a new object identity every render defeats the memo and the component refetches in a loop. See `auth-log-list.tsx` / `persons-list.tsx` for the pattern.
- **`TenantForm` snapshots `initialValues` on mount** (`useState(initialValues)`) and only re-syncs when its `loading` prop transitions from `true` to `false`. A form prefilled from a query result (e.g. `ChangeProfileForm` in `PersonDetail`) needs a `key` derived from the loaded values so a refresh remounts it instead of showing stale fields — see the `key={...}` comment in `person-detail.tsx`.

Not tracked by api-extractor (no `*.api.md`; the package has its own `api-extractor.json`, but `scripts/ae-build/run.js` only checks the packages already listed in `build/api/`, and this one isn't). See [tenant API reference](https://docs.contember.com/reference/engine/tenant/overview) for the operations behind these components.
