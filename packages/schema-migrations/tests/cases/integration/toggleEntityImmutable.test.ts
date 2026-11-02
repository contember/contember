import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests.js'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { SQL } from '../../src/tags.js'

namespace SchemaMutable {
	export class AuditLog {
		message = def.stringColumn()
	}
}

namespace SchemaImmutable {
	@def.Immutable()
	export class AuditLog {
		message = def.stringColumn()
	}
}

describe('mark entity immutable', () =>
	testMigrations({
		original: createSchema(SchemaMutable),
		updated: createSchema(SchemaImmutable),
		diff: [
			{
				modification: 'toggleEntityImmutable',
				entityName: 'AuditLog',
				immutable: true,
			},
		],
		sql: SQL``,
	}))

describe('unmark entity immutable', () =>
	testMigrations({
		original: createSchema(SchemaImmutable),
		updated: createSchema(SchemaMutable),
		diff: [
			{
				modification: 'toggleEntityImmutable',
				entityName: 'AuditLog',
				immutable: false,
			},
		],
		sql: SQL``,
	}))
