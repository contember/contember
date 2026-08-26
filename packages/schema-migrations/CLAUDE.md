# schema-migrations

Diffs two schema versions and generates ordered modifications that produce SQL migrations.

## Diffing Algorithm

`SchemaDiffer.diffSchemas(original, updated)`:
1. Validates both schemas
2. Runs 36+ differ types in carefully-ordered sequence (removals before creations, constraints after entities)
3. After each differ produces modifications, immediately applies them to the schema via `SchemaMigrator` (iterative)
4. Validates the final schema matches the target

## Differ Order (simplified)

Remove constraints/indexes → Remove views/entities/fields → Create enums → Rename tables/columns → Update columns/relations → Create entities/columns/relations/views → Create constraints/indexes → Update ACL/validation/actions

## Modification Handlers

Each modification type implements `ModificationHandler<Data>`:
- `createSql(builder)` — generates SQL via `MigrationBuilder`
- `getSchemaUpdater()` — pure function returning updated schema
- `describe()` — human-readable description with `isDestructive` flag

40+ modification types covering: entities, columns, relations, enums, constraints, indexes, views, ACL (with RFC 6902 JSON patches), validation, actions, settings.

## Migration Format

```typescript
interface Migration {
  version: string              // YYYY-MM-DD-HHIISS
  name: string                 // version-label
  formatVersion: number        // backward compat (latest = 6)
  modifications: Modification[]
}
```

## Key Patterns

- **Schema updaters**: Composable immutable update functions (`updateSchema`, `updateModel`, `updateEntity`, `updateField`, `updateAcl`)
- **Relation type visitors**: Different SQL for different relation types (ManyHasOne → FK column, ManyHasManyOwning → junction table, inverse → no SQL)
- **Version tracking**: Format versions control backward-compatible behavior changes

## PostgreSQL extensions

Contember deliberately does **not** run `CREATE EXTENSION` from schema or system migrations. A feature that needs one (the `similar` / `wordSimilar` trigram operators, the `gin_trgm_ops` index `opClass`) only documents the prerequisite; enabling it is a one-off operator task per database.

Extensions typically require superuser, behave differently on managed PostgreSQL, and a failed `CREATE EXTENSION` mid-migration is hard to roll back — auto-installing one could break the migration run itself. Document the requirement in the relevant docs page with a `:::caution[...]` admonition instead (see `docs/CLAUDE.md`).

## View updates

A view whose SQL changed used to drop and recreate its entire dependant cascade, re-emit full entity definitions and re-patch all ACL — a single view change could produce a 50–170 kB migration. Cause: `RemoveViewDiffer` + `CreateViewDiffer` always took the destructive path, and `removeEntity` stripped the entity's ACL for `UpdateAclSchemaDiffer` to add straight back.

`UpdateViewDiffer` (with `isReplaceableViewChange` in `modifications/utils/viewDependencies.ts`, wired into `SchemaDiffer` after `CreateViewDiffer`) now emits a single `updateView` (`CREATE OR REPLACE VIEW`) for SQL-only and view-metadata changes on non-materialized views — no dependant cascade, no ACL re-patch. Materialized views and structural changes still cascade.

**`CREATE OR REPLACE VIEW` is narrower than it looks** (verified on PG16): the new query must produce the same column names, in the same order, with the same types, and may only append at the end. Any deviation is a hard error (SQLSTATE 42P16) and transactional — column reorder, middle insert, and *any* type change including widening (`int`→`bigint`, `varchar(10)`→`varchar(20)`, `text`→`varchar`, `int`→`numeric`) all fail.

`isReplaceableViewChange` compares Contember `fields`, which is **necessary but not sufficient**, because a view's real column types and order come from the SQL body rather than the field metadata. The two residual cases — a SQL column reorder with an unchanged field set, and output-type drift without a matching field-type change — fail loudly at execute time, before any data is touched, never silently; both imply a schema/SQL inconsistency that the old drop-and-recreate masked.

## Key Files

- `SchemaDiffer.ts` — main differ orchestrator
- `SchemaMigrator.ts` — applies modifications to schema during diffing
- `MigrationDescriber.ts` — converts modifications to descriptions and SQL
- `modifications/` — all modification handlers organized by type (columns/, entities/, relations/, acl/, etc.)
