# schema-definition

TypeScript decorator-based API for defining Contember schemas. Converts decorated classes into the internal `Schema` representation (model + ACL + validation + actions).

## Schema Building Flow

`createSchema(definitions)` orchestrates:
1. `SchemaDefinition.createModel()` — entities and fields from decorated classes
2. `InputValidation.parseDefinition()` — validation rules from property decorators
3. `AclDefinition.createAcl()` — permissions from `@allow` decorators and role/variable definitions
4. `ActionsDefinition.createActions()` — triggers from `@trigger`/`@watch` decorators

## Field Definitions (Fluent API)

Column factories: `column()`, `stringColumn()`, `intColumn()`, `boolColumn()`, `doubleColumn()`, `dateColumn()`, `timeColumn()`, `dateTimeColumn()`, `jsonColumn()`, `enumColumn()`, `uuidColumn()`

Chainable methods: `.nullable()`, `.notNull()`, `.default()`, `.unique()`, `.sequence()`, `.columnName()`, `.columnType()`, `.collation()`

Relation factories: `manyHasOne()`, `oneHasOne()`, `oneHasMany()`, `manyHasMany()`, `manyHasManyInverse()`, `oneHasOneInverse()`

Relation methods: `.inversedBy()`, `.joiningColumn()`, `.onDelete()` / `.cascadeOnDelete()` / `.setNullOnDelete()`, `.notNull()`, `.removeOrphan()`, `.orderBy()`

## Entity Decorators

- `@Index({ fields, method? })` — database index
- `@Unique({ fields, timing?, nulls? })` — unique constraint
- `@View(sql, { dependencies?, idSource?, materialized? })` — database view
- `@OrderBy(field, direction)` — default ordering
- `@DisableEventLog()` — disable audit triggers

## ACL Definition

- `createRole(name, options)` — define a role
- `@allow(role, { read?, create?, update?, delete?, when? })` — entity permissions
- `createEntityVariable()`, `createConditionVariable()`, `createPredefinedVariable()` — ACL variables
- `canRead()`, `canUpdate()`, `canCreate()`, `canDelete()` — predicate references

## Validation

Property decorators: `@assert()`, `@required()`, `@assertDefined()`, `@assertNotEmpty()`, `@assertPattern()`, `@assertMinLength()`, `@assertMaxLength()`

Conditional: `@when(condition).assertMinLength(3, 'msg')`

## Actions

- `@trigger({ name, create?, update?, delete?, target })` — basic CRUD trigger
- `@watch({ name, watch, target })` — deep change tracking
- `createActionsTarget({ name, ...config })` — webhook target
- `createAuditLogTarget({ entity, synchronous? })` — built-in audit-log target (writes into a content entity, no webhook). `entity` is an entity-class reference (or `() => Entity` thunk), resolved to a name in `ActionsFactory` (like View `dependencies`).
- `@AuditLog({ watch, entity, name?, synchronous?, rootRelation? })` — sugar over `@watch` + an audit-log target. `entity` is a class reference / thunk pointing at an explicit sink in the model; extend `AuditLogEntity` for the default fields/indexes or write a compatible entity by hand. `actions/definition/auditLog.ts`.

## Metadata Storage

Supports both legacy TypeScript decorators (`reflect-metadata`) and TC39 Stage 3 decorators via `createMetadataStore()`.

## Convenience Export

The `c` object bundles all decorators and factories for concise usage: `c.stringColumn()`, `c.manyHasOne()`, `c.Allow()`, `c.Assert()`, etc.

## Key Directories

- `model/definition/fieldDefinitions/` — ColumnDefinition, relation definitions
- `model/definition/internal/` — SchemaBuilder, EntityRegistry, EnumRegistry
- `acl/definition/` — roles, permissions, variables, AclFactory
- `validation/` — rule builders, parseDefinition
- `actions/definition/` — triggers, targets, ActionsFactory
