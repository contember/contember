import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester'
import { createSchema, c } from '@contember/schema-definition'

namespace ArrayModel {
	export class Foo {
		stringList = c.stringColumn().list()
		enumList = c.enumColumn(c.createEnum('a', 'b', 'c')).list()
	}
}

test('Content API: create & read array', async () => {
	const tester = await createTester(createSchema(ArrayModel))

	const result = await tester(
		gql`
			mutation {
                createFoo(data: { 
						stringList: ["hello", "world"], 
						enumList: [a, b],
				}) {
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
					stringList
					enumList
				}
			}
		`,
	)
		.expect(response => {
			expect(response.body.data).toStrictEqual({
				listFoo: [
					{
						stringList: ['hello', 'world'],
						enumList: ['a', 'b'],
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
				updateFoo(by: { id: $id }, data: { stringList: ["world"], enumList: [c] }) {
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
                    stringList
                    enumList
				}
			}
		`,
	)
		.expect(response => {
			expect(response.body.data).toStrictEqual({
				listFoo: [
					{
						stringList: ['world'],
						enumList: ['c'],
					},
				],
			})
		})
		.expect(200)

	// filters

	await tester(
		gql`
			query {
				includesMatch: listFoo(filter: { 
					stringList: { includes: "world" }
					enumList: { includes: c }
				}) {
					id
				}
                includesNotMatch: listFoo(filter: { stringList: { includes: "hello" } }) {
                    id
                }
				
				minLengthMatch: listFoo(filter: { stringList: { minLength: 1 } }) {
					id
                }
				
				minLengthNotMatch: listFoo(filter: { stringList: { minLength: 3 } }) {
					id
                }
				
				maxLengthMatch: listFoo(filter: { stringList: { maxLength: 1 } }) {
					id		
                }
				
				maxLengthNotMatch: listFoo(filter: { stringList: { maxLength: 0 } }) {
					id
                }
				
			}
		`,
	)
		.expect(response => {
			expect(response.body.data.includesMatch).toHaveLength(1)
			expect(response.body.data.includesNotMatch).toHaveLength(0)
			expect(response.body.data.minLengthMatch).toHaveLength(1)
			expect(response.body.data.minLengthNotMatch).toHaveLength(0)
			expect(response.body.data.maxLengthMatch).toHaveLength(1)
			expect(response.body.data.maxLengthNotMatch).toHaveLength(0)
		})
		.expect(200)

})
