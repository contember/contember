import {  expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'

namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}


test('Content API: X-Contember-Ref header', async () => {

	const tester = await createTester(createSchema(TagModel))

	// Check that X-Contember-Ref work for empty schema
	await tester(
		gql`
			query {
				listTag(filter: { label: { eq: "typescript" } }) {
					label
				}
			}
		`,
	)
		.set('X-Contember-Ref', 'None')
		.expect(response => {
			expect(response.body.data).toStrictEqual({
				listTag: [],
			})
		})
		.expect(200)

	await tester(
		gql`
			mutation {
				createTag(data: { label: "typescript" }) {
					ok
				}
			}
		`,
	).expect(200)

	const response = await tester(
		gql`
			query {
				listTag(filter: { label: { eq: "typescript" } }) {
					label
				}
			}
		`,
	)
		.set('X-Contember-Ref', 'None')
		.expect(response => {
			expect(response.body.data).toStrictEqual({
				listTag: [
					{
						label: 'typescript',
					},
				],
			})
		})
		.expect(200)
	const eventKey = response.get('X-Contember-Ref')
	await tester(
		gql`
			query {
				listTag {
					label
				}
			}
		`,
	)
		.set('X-Contember-Ref', eventKey)
		.expect(304)

	// ignored for mutation
	await tester(
		gql`
			mutation {
				createTag(data: { label: "typescript" }) {
					ok
				}
			}
		`,
	)
		.set('X-Contember-Ref', eventKey)
		.expect(200)
})
