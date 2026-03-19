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

## Key Files

- `SchemaDiffer.ts` — main differ orchestrator
- `SchemaMigrator.ts` — applies modifications to schema during diffing
- `MigrationDescriber.ts` — converts modifications to descriptions and SQL
- `modifications/` — all modification handlers organized by type (columns/, entities/, relations/, acl/, etc.)
