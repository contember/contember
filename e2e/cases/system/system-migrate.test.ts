import { assert, test } from 'vitest'
import { createTester } from '../../src/tester'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator } from '@contember/schema-migrations'

namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}

const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))

test('System API: migrate project', async () => {
	const tester = await createTester(emptySchema)
	const schema = createSchema(TagModel)
	const migration = differ.diffSchemas(emptySchema, schema)

	await tester(`query {
		listTag {
			id
		}
	}`)
		.expect(400)
		.expect(response => {
			assert.deepStrictEqual(
				response.body.errors[0].message,
				'Cannot query field "listTag" on type "Query".',
			)
		})

	await tester.migrate(migration, '2024-03-07-120000-foo')
	await tester(`query {
		listTag {
			id
		}
	}`)
		.expect(200)

	await tester(`query {
		schema
	}`, {
		path: `/system/${tester.projectSlug}`,
	})
		.expect(response => {
			assert.deepStrictEqual(response.body.data, {
				schema,
			})
		})
		.expect(200)
})
