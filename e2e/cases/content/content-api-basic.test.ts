import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'

namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}

test('Content API: create & read tag', async () => {
	const tester = await createTester(createSchema(TagModel))

	await tester(
		gql`
			mutation {
				createTag(data: { label: "graphql" }) {
					ok
				}
			}
		`,
	)
		.expect(response => {
			expect(response.body.data).toStrictEqual({
				createTag: {
					ok: true,
				},
			})
		})
		.expect(200)

	await tester(
		gql`
			query {
				listTag(filter: { label: { eq: "graphql" } }) {
					label
				}
			}
		`,
	)
		.expect(response => {
			expect(response.body.data).toStrictEqual({
				listTag: [
					{
						label: 'graphql',
					},
				],
			})
		})
		.expect(200)
})
