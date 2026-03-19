# authorization

Composable, async authorization system using tree-based access evaluation.

## AccessNode Tree

Decisions are modeled as a tree of composable nodes:
- `AccessNode.Roles(roles[])` — terminal node, delegates to `AccessEvaluator`
- `AccessNode.Union(nodes[])` — OR: any child allows → allowed
- `AccessNode.Intersection(nodes[])` — AND: all children must allow (empty = deny)
- `AccessNode.Negate(node)` — NOT: inverts result
- `AccessNode.Fixed.allowed()` / `.denied()` — constant result

## Permissions

```typescript
const permissions = new Permissions()
permissions.allow('admin', createAction('article', 'write'))
permissions.allow('user', createAction('article', 'read'), meta => meta.published)
```

Lookup: exact resource+privilege → wildcard resource → wildcard privilege → wildcard both. Custom verifier functions receive metadata for context-specific decisions.

## Evaluation Flow

```
Authorizator.isAllowed(identity, scope, action)
  → scope.getIdentityAccess(identity) → AccessNode
  → Union(scopeNode, Roles(identity.roles))
  → node.isAllowed(evaluator, action)
  → PermissionEvaluator checks each role against Permissions map
```

## Scopes

`AuthorizationScope` maps identities to AccessNodes:
- `Fixed(node)` — same node for all identities
- `Global` — denies all (default)
- `Intersection(scopes[])` / `Union(scopes[])` — composite scopes
