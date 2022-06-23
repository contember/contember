import { assert, test } from 'vitest'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createTester, gql } from '../src/tester.js'


namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}

test('Content API: invalid schema error', async () => {
	const tester = await createTester(createSchema(TagModel))

	await tester(
		gql`
			mutation {
				createFoo(data: { label: "graphql" }) {
					ok
				}
			}
		`,
	)
		.expect(400)
		.expect(response => {
			assert.deepStrictEqual(
				response.body.errors[0].message,
				'Cannot query field "createFoo" on type "Mutation". Did you mean "createTag"?',
			)
		})
})
