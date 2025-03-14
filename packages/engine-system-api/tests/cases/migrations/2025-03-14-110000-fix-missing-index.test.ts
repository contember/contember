import migration from '../../../src/migrations/2025-03-14-110000-fix-missing-index'
import { createMigrationBuilder } from '@contember/database-migrations'
import { expect, test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { createConnectionMock } from '@contember/database-tester'
import { createDatabaseMetadata } from '@contember/database'

namespace IndexModel {

	@c.Index('colA', 'colB')
	@c.Index('colB', 'colC')
	export class Foo {
		colA = c.stringColumn()
		colB = c.stringColumn()
		colC = c.stringColumn()
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
			indexes: [
				{ indexName: 'valid1', tableName: 'foo', columnNames: ['col_a', 'col_b'], unique: false },
			],
			uniqueConstraints: [],
		})),
		schemaResolver: () => Promise.resolve({
			schema: createSchema(IndexModel),
			meta: {
				id: 1,
				version: '2024-06-28-153001',
				checksum: '_checksum_',
				updatedAt: new Date(),
			},
		}),
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
	expect(
		builder.getSql(),
	).toEqual(
		`CREATE INDEX ON "stage_live"."foo" ("col_b", "col_c");
`,
	)
})

