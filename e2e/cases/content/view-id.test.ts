import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester'
import { c, createSchema, SchemaDefinition as def } from '@contember/schema-definition'

namespace ViewIdTest {
	@c.View(`
SELECT 
	null as id, 
	1 as value
`)
	export class Foo {
		value = def.intColumn()
	}
}

test('read view with generated id', async () => {
	const tester = await createTester(createSchema(ViewIdTest))

	await tester(
		gql`
			query {
				listFoo {
					id
					value
				}
			}
		`,
	)
		.expect(response => {
			expect(response.body.data.listFoo).toHaveLength(1)
			expect(response.body.data.listFoo[0].id).toMatch(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/)
		})
		.expect(200)

})
