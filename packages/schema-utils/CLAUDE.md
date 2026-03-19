# schema-utils

Utilities for schema manipulation, validation, ACL processing, traversal, and code generation.

## Model Utilities (`modelUtils.ts`)

- `getEntity()`, `getField()`, `getColumnName()`, `getTargetEntity()` — schema navigation
- `acceptFieldVisitor()`, `acceptEveryFieldVisitor()`, `acceptRelationTypeVisitor()` — visitor pattern
- `isRelation()`, `isColumn()`, `isInverseRelation()`, `isOwningRelation()` — type guards

## ACL Utilities

- `PredicateDefinitionProcessor` — converts ACL predicate definitions (Where clauses with variables) to processed conditions
- `AllowAllPermissionFactory` — creates full-access permissions for all entities
- `getRoleVariables()` — recursively resolves role variables including inherited ones

## Validation

- `SchemaValidator` — validates complete schema (delegates to Model/Acl/Validation/ActionsValidator)
- `ModelValidator` — entity/field/constraint structure validation
- `AclValidator` — role/variable/predicate validation

## Other Utilities

- `normalizeSchema()` — ensures standard roles exist (ADMIN, CONTENT_ADMIN, DEPLOYER)
- `filterSchemaByStage()` — filters roles by stage regex patterns
- `calculateSchemaChecksum()` — MD5 of JSON schema
- `DefaultNamingConventions` — camelCase → snake_case for tables/columns/joins
- `LaxSchemaConverter` — converts simplified schema format to full Schema
- `DefinitionCodeGenerator` — generates TypeScript schema definition code from schema
