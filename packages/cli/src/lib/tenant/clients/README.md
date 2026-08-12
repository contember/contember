# Tenant domain clients

One class per tenant domain, all sharing a single `TenantApiTransport`
(`../TenantApiTransport.ts`). Add methods to the class that owns the domain — never a new client, and
never a raw `GraphQlClient`.

| Client                 | Owns                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `TenantProjectClient`  | projects, project secrets, global config, identity providers, `me` |
| `TenantPersonClient`   | persons, global identity roles, sessions                       |
| `TenantMemberClient`   | project memberships, invites                                   |
| `TenantApiKeyClient`   | api keys                                                       |
| `TenantPolicyClient`   | auth policies, mail templates, auth log                        |

## The pattern

### 1. Declare the fetcher at module level

Fetchers from `@contember/graphql-client-tenant` are immutable and reusable, so build them once at
module load — not per call.

```ts
import { mutation$, person$$, query$, disablePersonError$$, disablePersonResponse$$ } from '@contember/graphql-client-tenant'

const personsFetcher = query$.persons(person$$)
const disablePersonFetcher = mutation$.disablePerson(disablePersonResponse$$.error(disablePersonError$$))
```

`x$` is the empty fetcher for type `X`, `x$$` selects all its scalar fields, and `.field(childFetcher)`
descends into a reference or a list. Field arguments become GraphQL variables of the same name.

### 2. Call `transport.exec(fetcher, variables)`

```ts
public async listPersons({ filter, limit, offset }: ListPersonsArgs = {}): Promise<TenantPerson[]> {
	const result = await this.transport.exec(personsFetcher, { filter, limit, offset })
	return result.persons.map(it => ({ id: it.id, email: it.email ?? null }))
}
```

`exec` works the same for queries and mutations — the root type comes from the fetcher. `variables` is
typed by the fetcher, so a missing or misnamed variable is a compile error.

**Return a CLI-owned type, not the wire type.** Generated selections mark nullable fields as
`?: T` (optional, never `null`); commands print JSON, so map them to `T | null` explicitly. That also
keeps the command layer independent of codegen churn.

### 3. Assert mutation payloads with `transport.assertOk`

Every tenant mutation returns `{ ok, error { code, developerMessage } }`. Do not read `ok` yourself:

```ts
public async disablePerson(personId: string): Promise<void> {
	const result = await this.transport.exec(disablePersonFetcher, { personId })
	this.transport.assertOk(result.disablePerson, `disablePerson(${personId})`)
}
```

The string is the operation label used in the error message. Only branch on a code yourself when a
specific code is *not* an error for the caller — see `TenantProjectClient.createProject`, where
`ignoreExisting` swallows `ALREADY_EXISTS`.

## Error normalization — already done for you

Never throw a string and never catch to re-wrap. Everything that leaves the transport is already a
`CliError` with a stable `code` and the right `ExitCode`:

- **Mutation payload errors** → `code` is the tenant error code verbatim (`ALREADY_EXISTS`,
  `PERSON_NOT_FOUND`, …), so `--json` gives an agent `.error.code` it can branch on. The exit code
  comes from `tenantErrorCodeToExitCode`: `*_NOT_FOUND` → `NotFound`, `ALREADY_*` → `Conflict`,
  rate limits → `Transient`, permission/MFA failures → `Forbidden`, everything else → `InputError`.
- **Transport failures** → `TENANT_API_UNREACHABLE` / `TENANT_API_SERVER_ERROR` / `TENANT_API_ABORTED`
  (`Transient`, retryable), `TENANT_API_UNAUTHORIZED` / `TENANT_API_FORBIDDEN` (`Forbidden`),
  `TENANT_API_BAD_REQUEST` (`InputError`), `TENANT_API_INVALID_RESPONSE` (`InternalError`). A
  resolver-level `ForbiddenError` GraphQL extension is detected too, whatever the HTTP status.

If a code maps to the wrong class, fix the table in `TenantApiTransport.ts` — do not special-case it
in a client or a command.

## Getting a client

- In a command wired through DI: `TenantClientProvider` (`../../TenantClientProvider.ts`) exposes
  `project()`, `person()`, `member()`, `apiKey()` and `policy()`.
- From an explicit endpoint and token: `createTenantClients(TenantApiTransport.create(url, token))`.
