# schema

Pure TypeScript type definitions for the Contember schema. No runtime logic — only interfaces, types, and enums used by all other packages.

## Main Types

- **Model** (`model.ts`): `Entity`, `Column`, relation types (`ManyHasOne`, `OneHasOne`, `OneHasMany`, `ManyHasMany` with owning/inverse variants), `ColumnType` enum (Uuid, String, Int, Double, Bool, Enum, DateTime, Date, Time, Json), unique constraints, indexes, views, field visitors
- **ACL** (`acl.ts`): `Roles`, `EntityPermissions`, `EntityOperations`, `FieldPermissions`, `PredicateDefinition`, variables (`EntityVariable`, `PredefinedVariable`, `ConditionVariable`), `Membership`, tenant/system/content permissions
- **Input** (`input.ts`): GraphQL input types for mutations (Create/Update/Delete/Upsert), query inputs (Where, OrderBy, Condition with all operators), relation operations (connect, disconnect, create, etc.)
- **Validation** (`validation.ts`): `Validator` discriminated union (and, or, not, pattern, range, etc.), `ValidationRule`, entity rules
- **Actions** (`actions.ts`): `BasicTrigger`, `WatchTrigger`, `WebhookTarget`, `SelectionNode`
- **Result** (`result.ts`): Mutation results, validation results, execution errors with path fragments
- **Settings** (`settings.ts`): `TenantSettings`, `ContentSettings` (uuidVersion 4/7, date formats)

## Top-Level Schema Type

```typescript
interface Schema {
  model: Model.Schema    // entities + enums
  acl: Acl.Schema        // roles + permissions
  validation: Validation.Schema
  actions: Actions.Schema
  settings: Settings.Schema
}
```
