# react-ui-lib-tenant

Ready-made admin UI for **tenant management** — listings and forms for persons, project members, API keys, project secrets, invitations, and 2FA setup. Styled components built on the `@contember/react-ui-lib-base` primitives (shadcn-style), wired to `react-client-tenant` query hooks and the form context from `react-identity`.

## Listings (`listing/`)

- `MemberList` — the base project-members table (pagination, refresh, delete, edit-roles dialog). Parameterized by `tableHeaders` / `tableColumns`.
- `PersonList`, `ApiKeyList` — specialize `MemberList` by `memberType` (`PERSON` / `API_KEY`).
- `PersonsList` — tenant-wide person listing (`usePersonsQuery`) with an email filter, pagination, roles, and the MFA column.
- `GlobalApiKeyList` — global permanent keys (`useGlobalApiKeysQuery`) with a disable action.
- `ProjectSecretList` — secret keys + timestamps (`useProjectSecretsQuery`); never values.
- `MemberDeleteDialog`, `MfaBadges` — shared building blocks (`MfaBadges` renders the TOTP / email-OTP state).

## Forms (`forms/`)

- `common.tsx` — `TenantFormField` / `TenantFormError` / `TenantFormLabel` / `TenantFormInput`, generic over a `FormContextValue`.
- Field components: `InviteFormFields`, `CreateApiKeyFormFields`, `CreateGlobalApiKeyFormFields`, `UpdateProjectMemberFormFields`, plus auth forms (`login`, `password-reset`, `verify-email`, …).
- `MembershipsControl` — role/variable picker, with `useIntrospectionRolesConfig(projectSlug)` resolving roles from the project schema.

Field components read their form state via a `useXForm()` hook — the **provider** for that form (e.g. `CreateGlobalApiKeyForm`) lives in `react-client-tenant` and is re-exported through `react-identity` / `interface`. A consumer wraps the fields in the provider and handles `onSuccess`.

## Other

- `otp/` — `OtpSetup` (TOTP enroll / disable flow).
- `hooks/` — `useInvite`, `useInviteUser`.

## Conventions

- **Data**: `useTenantQueryLoader(useXQuery(), variables)`, then `switch (query.state)` over `loading | refreshing | success | error`. Project-scoped lists read the slug via `useProjectSlug()`.
- **i18n**: a single static `dict.ts` (no message formatter). Components read `dict.tenant.*`; add new strings there.
- **UI primitives** come from `@contember/react-ui-lib-base`; icons from `lucide-react`. Styling is Tailwind utility classes inline.

Not tracked by api-extractor (no `*.api.md`). See [tenant API reference](https://docs.contember.com/reference/engine/tenant/overview) for the operations behind these components.
