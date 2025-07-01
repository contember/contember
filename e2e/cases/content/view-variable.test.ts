import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester'
import { c, createSchema, SchemaDefinition as def } from '@contember/schema-definition'

namespace ViewVariableSystemTest {
	@c.View(`
SELECT
	null as id,
	migrations.name as name
FROM {{system_schema}}.schema_migration AS migrations
`)
	export class Foo {
		name = def.stringColumn()
	}
}

test('read view with variable', async () => {
	const tester = await createTester(createSchema(ViewVariableSystemTest))

	await tester(
		gql`
			query {
				listFoo {
					id
					name
				}
			}
		`,
	)
		.expect(response => {
			expect(response.body.data.listFoo).toHaveLength(1)
			expect(response.body.data.listFoo[0].name).toBe('2024-07-01-120000-init')
		})
		.expect(200)

})
