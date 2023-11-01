import migration from '../../../src/migrations/2023-09-11-174000-fix-on-delete'
import { createMigrationBuilder } from '@contember/database-migrations'
import { assert, test } from 'vitest'
import { SchemaBuilder } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { createConnectionMock } from '@contember/database-tester'
import { ForeignKeyDeleteAction, createDatabaseMetadata, emptyDatabaseMetadata } from '@contember/database'


test('table-on-delete test', async () => {
	const builder = createMigrationBuilder()
	const connection = createConnectionMock([{
		sql: 'select schema from stage',
		response: { rows: [{ schema: 'stage_live' }] },
	}])
	await migration(builder, {
		connection: connection,
		databaseMetadataResolver: () => Promise.resolve(createDatabaseMetadata({
			indexes: [],
			uniqueConstraints: [],
			foreignKeys: [{
				constraintName: 'fk_post_author_id_author_id',
				fromColumn: 'author_id',
				fromTable: 'post',
				toColumn: 'id',
				toTable: 'author',
				deleteAction: ForeignKeyDeleteAction.cascade,
				deferrable: false,
				deferred: false,
			}],
		})),
		schemaResolver: () => Promise.resolve(({ ...emptySchema, model: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasOne('author', relation => relation.target('Author').onDelete(Model.OnDelete.setNull)),
			)
			.entity('Author', entity => entity)
			.buildSchema() })),
		project: {
			slug: 'test',
			systemSchema: 'system',
			stages: [
				{
					slug: 'prod',
					name: 'prod',
				},
			],
		},
	})
	assert.equal(
		builder.getSql(),
		`ALTER TABLE "stage_live"."post" DROP CONSTRAINT "fk_post_author_id_author_id";
ALTER TABLE "stage_live"."post"
					ADD FOREIGN KEY ("author_id") 
					REFERENCES "stage_live"."author" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE
				;
`,
	)
})


test('table-on-delete test valid', async () => {
	const builder = createMigrationBuilder()
	const connection = createConnectionMock([{
		sql: 'select schema from stage',
		response: { rows: [{ schema: 'stage_live' }] },
	}])
	await migration(builder, {
		connection: connection,
		databaseMetadataResolver: () => Promise.resolve(createDatabaseMetadata({
			indexes: [],
			uniqueConstraints: [],
			foreignKeys: [{
				constraintName: 'fk_post_author_id_author_id',
				fromColumn: 'author_id',
				fromTable: 'post',
				toColumn: 'id',
				toTable: 'author',
				deleteAction: ForeignKeyDeleteAction.setnull,
				deferred: false,
				deferrable: false,
			}],
		})),
		schemaResolver: () => Promise.resolve(({
			...emptySchema, model: new SchemaBuilder()
				.entity('Post', entity =>
					entity.manyHasOne('author', relation => relation.target('Author').onDelete(Model.OnDelete.setNull)),
				)
				.entity('Author', entity => entity)
				.buildSchema(),
		})),
		project: {
			slug: 'test',
			systemSchema: 'system',
			stages: [
				{
					slug: 'prod',
					name: 'prod',
				},
			],
		},
	})
	assert.equal(
		builder.getSql(),
		`\n`,
	)
})

