import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'

namespace JsonModel {
	export class Foo {
		data = def.jsonColumn()
	}
}

test('Content API: create & read json', async () => {
	const tester = await createTester(createSchema(JsonModel))

	const result = await tester(
		gql`
			mutation {
                createFoo(data: { data: [{message: "hello" }]}) {
					ok
					node {
						id
					}
				}
			}
		`,
	)
		.expect(response => {
			expect(response.body.data.createFoo.ok).toBe(true)
		})
		.expect(200)


	await tester(
		gql`
			query {
				listFoo {
					data
				}
			}
		`,
	)
		.expect(response => {
			expect(response.body.data).toStrictEqual({
				listFoo: [
					{
						data: [{ message: 'hello' }],
					},
				],
			})
		})
		.expect(200)

	// update

	const id = result.body.data.createFoo.node.id
	await tester(
		gql`
			mutation($id: UUID!) {
				updateFoo(by: { id: $id }, data: { data: { message: "world" } }) {
					ok
				}
			}
		`,
		{
			variables: { id },
		},
	)
		.expect(response => {
			expect(response.body.data.updateFoo.ok).toBe(true)
		})
		.expect(200)

	// read

	await tester(
		gql`
			query {
				listFoo {
					data
				}
			}
		`,
	)
		.expect(response => {
			expect(response.body.data).toStrictEqual({
				listFoo: [
					{
						data: { message: 'world' },
					},
				],
			})
		})
		.expect(200)
})
