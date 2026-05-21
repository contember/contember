# @contember/policy

AWS-IAM-style JSON policy engine. Composable, async, source-agnostic.

```ts
import { PolicyEngine, StaticPolicySource } from '@contember/policy'

const engine = new PolicyEngine([
  new StaticPolicySource('tenant-db', [
    {
      effect: 'allow',
      actions: ['tenant:person.viewSessions', 'tenant:person.forceSignOut'],
      resources: ['person:*'],
      conditions: { stringEquals: { 'subject.person.team': '${identity.team}' } },
    },
  ]),
])

const result = await engine.evaluate(
  'tenant:person.forceSignOut',
  'person:abc-123',
  { identity: { team: 'eng' }, subject: { person: { team: 'eng' } } },
)
// result.decision === 'allow'
```

See `tests/cases/unit/*.test.ts` for the full operator surface and matching rules.

> The example above uses an arbitrary resource pattern (`person:*`) to show the
> engine's generality. Individual consumers choose their own resource scheme —
> e.g. the Contember tenant API only ever evaluates against `*` and
> `project:<slug>`, expressing finer targeting with conditions rather than the
> resource string.
