# @contember/engine-tenant-api

API for Contember user & API key management.

## Custom tenant roles

Custom roles are runtime-defined global roles stored in `custom_role`. An identity receives one through the existing
`addGlobalIdentityRoles` mutation. Each definition contains explicit grants:

```graphql
input CustomRoleGrantInput {
	permission: String!
	config: Json
}
```

The grant catalog is an explicit allowlist returned by `customRolePermissions`; adding a new `PermissionActions` entry never makes it grantable
automatically. Its action surface is a subset of the built-in `project_admin` permissions; `project:create` remains reserved for `project_creator`
and `super_admin`. Project and membership authorization remains controlled by project schema ACL. The only project-aware exception is
mail-template management, whose dedicated configuration matches exact project slugs and mail types.

Configurations are strict action-specific JSON objects validated with `@contember/typesafe`, like IdP configuration. Unknown properties, invalid
types, duplicate grants, nonexistent referenced roles/projects, and unsupported configuration are rejected. Invalid data found during evaluation
makes the entire persisted role inert.

Role constraints use:

```json
{
	"allowed": ["person", "support"],
	"denied": ["suspended_support"]
}
```

Every observed role must be in `allowed` and absent from `denied`. `super_admin` and `project_creator` are always denied by code and cannot appear in
an allowlist. Configured denies can only narrow this invariant.

Configured grant kinds:

- `ROLE_INPUT` (`person:signUp`) — `{ "roles": RoleConstraint }`.
- `TARGET_IDENTITY` (`person:disable`, `person:forceSignOut`, `person:resetMfa`, `person:viewSessions`, `person:viewIdp`,
  `person:changePassword`) — `{ "target": { "globalRoles": RoleConstraint, "projectMemberships": "none" | "any" } }`.
- `CHANGE_PROFILE` — the target selector plus `{ "fields": { "allowed": ["name" | "email"] } }`.
- `CREATE_SESSION_TOKEN` — the target selector plus
  `{ "session": { "maxExpirationMinutes": number, "allowTrustForwardedClientInfo": boolean } }`.
- `ROLE_MUTATION` (`identity:addGlobalRoles`, `identity:removeGlobalRoles`) — requested-role constraint, target selector, and `allowSelf`.
- `GLOBAL_API_KEY` (`apiKey:createGlobal`) — requested-role constraint and `allowTrustForwardedClientInfo`.
- `MAIL_TEMPLATE_SCOPE` (`mailTemplate:add`, `mailTemplate:remove`, `mailTemplate:list`) —
  `{ "global": boolean, "projects": ["exact-slug"], "types": ["FORCED_SIGN_OUT", "..."] }`.
- `NONE` — exact tenant-global actions with no configuration.

Custom-role grants compile into the existing `Permissions.allow(..., verifier)` mechanism. They do not introduce generic conditions, resource
patterns, first-class denies, or a parallel authorization data flow. Role definitions are cached once per request.

Deleting a custom role removes the definition and strips that slug from every `identity.roles` value in the same transaction, so no assignment
survives the role. The slug becomes available again; the `custom_role_change` audit entry keeps the record of what it used to grant.
