import migration from '../../../src/migrations/2023-10-19-173000-fix-unique'
import { createMigrationBuilder } from '@contember/database-migrations'
import { assert, test } from 'vitest'
import { c, createSchema } from '@contember/schema-definition'
import { createConnectionMock } from '@contember/database-tester'
import { createDatabaseMetadata } from '@contember/database'

namespace UniqueModel {

	@c.Unique('colA', 'colB')
	@c.Unique('manyHasOneBar', 'colB')
	export class Foo {
		hasOneBar = c.oneHasOne(Bar)
		manyHasOneBar = c.manyHasOne(Bar)
		singleColUnique = c.stringColumn().unique()

		colA = c.stringColumn()
		colB = c.stringColumn()
		colC = c.stringColumn()
	}

	export class Bar {

	}
}

test('unique fix test', async () => {
	const builder = createMigrationBuilder()
	const connection = createConnectionMock([{
		sql: 'select schema from stage',
		response: { rows: [{ schema: 'stage_live' }] },
	}])
	await migration(builder, {
		connection: connection,
		databaseMetadataResolver: () => Promise.resolve(createDatabaseMetadata({
			foreignKeys: [],
			indexes: [],
			uniqueConstraints: [
				{ constraintName: 'valid1', tableName: 'foo', columnNames: ['col_a', 'col_b'], deferrable: false, deferred: false },
				{ constraintName: 'valid2', tableName: 'foo', columnNames: ['col_b', 'many_has_one_bar_id'], deferrable: false, deferred: false },
				{ constraintName: 'valid3', tableName: 'foo', columnNames: ['single_col_unique'], deferrable: false, deferred: false },
				{ constraintName: 'valid4', tableName: 'foo', columnNames: ['has_one_bar_id'], deferrable: false, deferred: false },
				{ constraintName: 'invalid1', tableName: 'foo', columnNames: ['col_a', 'col_c'], deferrable: false, deferred: false },
				{ constraintName: 'invalid2', tableName: 'foo', columnNames: ['col_c', 'many_has_one_bar_id'], deferrable: false, deferred: false },

			],
		})),
		schemaResolver: () => Promise.resolve(createSchema(UniqueModel)),
		project: {
			slug: 'test',
			stages: [
				{
					slug: 'prod',
					name: 'prod',
				},
			],
			systemSchema: 'system',
		},
	})
	assert.equal(
		builder.getSql(),
		`ALTER TABLE "stage_live"."foo" DROP CONSTRAINT "invalid1";
ALTER TABLE "stage_live"."foo" DROP CONSTRAINT "invalid2";
`,
	)
})

