---
title: Policies
---

Policies are the authorization mechanism of the tenant API. Each request is
authorized as a triple — `(action, resource, context)` — evaluated by a
policy engine modelled after AWS IAM. The engine aggregates statements from
three sources:

- **Built-in role policies** — one per tenant role (`super_admin`, `login`,
  `person`, `project_member`, `project_creator`, `entrypoint_deployer`,
  `project_admin`). These define the baseline permission surface for the
  legacy role system.
- **Project schema policies** — derived from the project's tenant ACL
  (`acl.roles[*].tenant`) at request time.
- **User-defined policies** — JSON documents managed via the tenant GraphQL
  API and attached to individual identities.

This page is a reference for managing the third group through the tenant
API. Built-in policies are read-only and can be inspected via the
`builtinPolicies` query.

## Concepts

- **Action** — a verb on a tenant resource, namespaced as `tenant:<resource>.<verb>`,
  e.g. `tenant:project.addMember`.
- **Resource** — an ARN-like identifier of the object the action targets:
  `project:<slug>`, `person:<id>`, `identity:<id>`, `idp:<slug>`,
  `policy:<slug>`, or `*` for any.
- **Statement** — one rule: an `effect` (`allow`/`deny`), a list of
  `actions`, an optional list of `resources` (defaults to `*`), and an
  optional condition block.
- **Policy** — a versioned bundle of statements (`{ version, statements }`).
- **Assignment** — a row linking an identity to a policy, optionally
  parameterized with a `tags` object whose values are substituted into the
  policy's statements at evaluation time.

## Decision algorithm

The engine walks every source, collects matches, and decides:

1. Any matching `deny` ⇒ **deny** (deny wins, evaluation short-circuits).
2. Any matching `allow` ⇒ **allow**.
3. Otherwise ⇒ **deny** (default deny).

A statement matches when (1) one of its `actions` patterns globs the
requested action, (2) one of its `resources` patterns globs the requested
resource, and (3) all conditions evaluate to true against the request
context. Glob patterns use `*` (any sequence) and `?` (one char) and are
anchored.

## Authorization

All policy-management operations require the corresponding tenant action.
By default only **super admins** can manage policies; the project_admin
role does not include policy management. Granting these permissions to
other roles is intentional and requires extending the built-in policies
or assigning a custom policy.

| Operation | Required action |
| --- | --- |
| `policies`, `policy(slug)`, `builtinPolicies`, `Identity.policies` (others) | `tenant:policy.view` |
| `createPolicy` | `tenant:policy.create` |
| `updatePolicy` | `tenant:policy.update` |
| `deletePolicy` | `tenant:policy.delete` |
| `assignPolicy` | `tenant:policy.assign` |
| `revokePolicy` | `tenant:policy.revoke` |

`Identity.policies` is readable by the identity itself without any
permission check (self-view); reading it for another identity requires
`tenant:policy.view`.

## Statement shape

```json
{
  "effect": "allow",
  "actions": ["tenant:person.viewSessions", "tenant:person.forceSignOut"],
  "resources": ["person:*"],
  "conditions": {
    "stringEquals": { "subject.person.team": "${assignment.tags.team}" }
  }
}
```

A statement with no `conditions` and `resources: ["*"]` is the simplest
form: unconditional permission for the listed actions on any resource.

### Conditions

The condition block is `{ [operator]: { [path]: value } }`. All operators
must hold; within an operator, every path/value pair must hold. Values may
be a single primitive or an array (`any-of` semantics for positive
operators).

| Group | Operators |
| --- | --- |
| String | `stringEquals`, `stringEqualsIgnoreCase`, `stringNotEquals`, `stringLike`, `stringNotLike` |
| Numeric | `numericEquals`, `numericNotEquals`, `numericLessThan`, `numericLessThanEquals`, `numericGreaterThan`, `numericGreaterThanEquals` |
| Date (ISO 8601) | `dateLessThan`, `dateLessThanEquals`, `dateGreaterThan`, `dateGreaterThanEquals` |
| Boolean | `bool` (accepts `true`/`false` or `"true"`/`"false"` only) |
| Array shape | `forAllValues:stringEquals`, `forAnyValue:stringEquals`, `forAllValues:stringNotEquals`, `forAnyValue:stringNotEquals` |
| Object shape | `forAllKeys:stringEquals` |
| Presence | `exists` |

**Missing-context handling.** When a condition references a context path
the tenant API didn't populate, the engine resolves it per statement
effect: `allow` skips the statement; `deny` fires fail-closed. The
`forAllValues:*` and `forAllKeys:*` operators are an exception — they
treat a missing path as vacuously true (parallel to `.every()` over an
empty array).

### Placeholder substitution

Strings in `actions`, `resources`, and condition values can contain
`${path}` placeholders that resolve against the request context at
evaluation time:

```json
{
  "effect": "allow",
  "actions": ["tenant:project.viewMember"],
  "resources": ["project:${assignment.tags.project}"]
}
```

The tenant API populates `identity.id` and `identity.roles` automatically;
`assignment.tags.*` is baked in from the assignment row before evaluation.
Other namespaces (`subject.*`) are populated by the resolver per action.

If a placeholder cannot be resolved at evaluation time, the engine treats
it fail-closed — see the conditions section above.

## Managing policies via the tenant API

### Create

```graphql
mutation {
  createPolicy(input: {
    slug: "team-lead"
    label: "Team Lead"
    description: "View and force sign-out for own team"
    document: {
      version: "1"
      statements: [{
        effect: allow
        actions: ["tenant:person.viewSessions", "tenant:person.forceSignOut"]
        resources: ["person:*"]
        conditions: {
          stringEquals: { "subject.person.team": "${assignment.tags.team}" }
        }
      }]
    }
  }) {
    ok
    error { code developerMessage }
    result { policy { id slug } }
  }
}
```

Error codes:

```graphql
enum CreatePolicyErrorCode {
  INVALID_SLUG
  SLUG_RESERVED       # "builtin:" prefix is reserved
  SLUG_ALREADY_EXISTS
  INVALID_DOCUMENT
}
```

Slug requirements: 1–128 characters, alphanumeric / `_` / `-` / `.` / `:`,
must not start with the reserved `builtin:` prefix.

### Update

```graphql
mutation {
  updatePolicy(slug: "team-lead", input: {
    label: "Team Lead (revised)"
    document: { version: "1", statements: [...] }
  }) {
    ok
    error { code }
    result { policy { id slug version } }
  }
}
```

Only the fields supplied in `input` are touched. Pass `description: null`
to clear the description.

```graphql
enum UpdatePolicyErrorCode {
  POLICY_NOT_FOUND
  INVALID_DOCUMENT
}
```

### Delete

```graphql
mutation {
  deletePolicy(slug: "team-lead") {
    ok
    error { code }
  }
}
```

Deleting a policy cascades to its assignments — all identities lose the
policy immediately.

```graphql
enum DeletePolicyErrorCode { POLICY_NOT_FOUND }
```

### Assign / revoke

```graphql
mutation {
  assignPolicy(
    identityId: "2f673a53-af33-42b1-9e17-e1305fa26d9d"
    policySlug: "team-lead"
    tags: { team: "eng" }
  ) {
    ok
    error { code }
  }
}
```

Assignment is idempotent: re-assigning the same policy to the same
identity replaces the tags and `grantedBy`. `grantedBy` is set to the
calling identity automatically.

Tag values must be primitives or arrays of primitives. **Tag string values
must not contain `${...}` template syntax** — tag values are baked into
the policy's actions/resources/conditions at load time, so a templated tag
would let any caller with `policy:assign` rewrite the policy's effective
surface at evaluation time. Such inputs return `INVALID_TAGS`.

```graphql
enum AssignPolicyErrorCode {
  POLICY_NOT_FOUND
  IDENTITY_NOT_FOUND
  INVALID_TAGS
}
```

```graphql
mutation {
  revokePolicy(
    identityId: "2f673a53-af33-42b1-9e17-e1305fa26d9d"
    policySlug: "team-lead"
  ) {
    ok
    error { code }
  }
}
```

```graphql
enum RevokePolicyErrorCode {
  POLICY_NOT_FOUND
  NOT_ASSIGNED
}
```

### Inspect

```graphql
query {
  policies {
    id slug label description version createdAt updatedAt
    document { version statements { effect actions resources conditions } }
  }

  policy(slug: "team-lead") {
    id slug document { statements { effect actions } }
  }

  builtinPolicies {
    role slug label description
    document { statements { effect actions resources } }
  }
}
```

To inspect what an identity actually carries:

```graphql
query {
  me {
    policies {
      policy { slug label }
      tags
      grantedBy
      grantedAt
    }
  }
}
```

The same field exists on any `Identity` — viewing another identity's
policies requires the `tenant:policy.view` action.

## Built-in policies

Every tenant role has a corresponding built-in policy (`builtin:<role>`).
They are loaded from code, not from the database, and the `builtin:` slug
prefix is reserved for them.

| Role | Allowed |
| --- | --- |
| `super_admin` | everything (`*` on `*`) |
| `login` | sign-in flows, password reset, IdP sign-in, passwordless sign-in |
| `person` | view own profile, change own password / profile, manage OTP, sign out, toggle passwordless |
| `project_member` | view projects the identity is a member of |
| `project_creator` | create new projects |
| `entrypoint_deployer` | deploy entrypoint changes |
| `project_admin` | manage projects, members, identities, API keys, IdP, mail templates, system config — with role-escalation guards (see below) |

### Project-admin guards

The `project_admin` built-in includes two `deny` statements that mirror
guardrails from the legacy permission system:

- **Allowlist on global mutations.** `addGlobalRoles`, `removeGlobalRoles`,
  `createGlobalApiKey`, and `signUp` are denied when `subject.roles`
  contains anything outside `{login, project_admin, entrypoint_deployer}`.
  Project admins cannot grant themselves `super_admin` or
  `project_creator`, nor assign arbitrary unknown roles.
- **Denylist on person actions.** `createSessionToken`, `disablePerson`,
  `changePersonProfile`, and `changePersonPassword` are denied when
  `subject.targetRoles` contains `super_admin` or `project_creator` — a
  project admin cannot impersonate or disable a higher-privileged identity.

These guards depend on the resolver populating `subject.roles` /
`subject.targetRoles` on the request context. If the resolver forgets, the
deny still fires fail-closed via the missing-context semantics.

## Tenant-ACL-derived policies

The per-project `acl.roles[*].tenant` block is also translated into policy
statements at request time. The translation preserves the semantics of the
legacy `MembershipMatcher`:

- The action is allowable only if any of the invoker's memberships sets
  the governing field (`invite`, `unmanagedInvite`, `manage`, `view`).
- When the gate passes, every invoker membership contributes a statement
  matching the union behavior of the legacy implementation.
- For `invite` / `unmanagedInvite`, the effective rule for a role is
  `(field is an object) ? field : (manage ?? {})`. A role with
  `invite: true` and `manage: undefined` therefore matches nothing.

The tenant-ACL surface is documented separately in
[Tenant ACL](../schema/tenant-acl.md). It is not configured through
the policy CRUD API.

## Caching

The tenant DB policy source is instantiated per request and caches its
statement list on first call. Repeated authorization checks within one
request hit the database at most once, regardless of how many resolvers
call `requireAction`.
