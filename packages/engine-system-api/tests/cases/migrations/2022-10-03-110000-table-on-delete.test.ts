import migration from '../../../src/migrations/2022-10-03-110000-table-on-delete'
import { createMigrationBuilder } from '@contember/database-migrations'
import { assert, test } from 'vitest'
import { SchemaBuilder } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { createConnectionMock } from '@contember/database-tester'


test('table-on-delete test', async () => {
	const builder = createMigrationBuilder()
	const connection = createConnectionMock([{
		sql: 'select schema from stage',
		response: { rows: [{ schema: 'stage_live' }] },
	}])
	await migration(builder, {
		connection: connection,
		schemaResolver: () => Promise.resolve(({ ...emptySchema, model: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasOne('author', relation => relation.target('Author').onDelete(Model.OnDelete.setNull)),
			)
			.entity('Author', entity => entity)
			.buildSchema() })),
		project: {
			slug: 'test',
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
		`ALTER TABLE "stage_live"."post" DROP CONSTRAINT "fk_post_author_id_87ef9a";
ALTER TABLE "stage_live"."post"
  ADD CONSTRAINT "fk_post_author_id_87ef9a" FOREIGN KEY ("author_id") REFERENCES "stage_live"."author"("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;
`,
	)
})

