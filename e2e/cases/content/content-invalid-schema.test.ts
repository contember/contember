import { expect, test } from 'bun:test'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createTester, gql } from '../../src/tester'


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
			expect(
				response.body.errors[0].message,
			).toEqual(
				'Cannot query field "createFoo" on type "Mutation". Did you mean "createTag"?',
			)
		})
})
