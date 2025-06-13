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

test('Content API: JSON includes operator', async () => {
	const tester = await createTester(createSchema(JsonModel))

	// Create test data with different JSON structures
	const testData = [
		{ data: { name: 'John', age: 30, config: { theme: 'dark' } } },
		{ data: { name: 'Jane', age: 25 } },
		{ data: [1, 2, 3, 4, 5] },
		{ data: ['apple', 'banana', 'cherry'] },
		{ data: { tags: ['red', 'blue'] } },
		{ data: [{ id: 1, name: 'Product A' }, { id: 2, name: 'Product B' }] },
	]

	// Create all test records
	for (const testItem of testData) {
		await tester(
			gql`
				mutation($data: Json!) {
					createFoo(data: { data: $data }) {
						ok
						node {
							id
						}
					}
				}
			`,
			{ variables: testItem },
		)
			.expect(response => {
				expect(response.body.data.createFoo.ok).toBe(true)
			})
			.expect(200)
	}

	// Test JSON containment with @> operator
	await tester(
		gql`
			query {
				# Test partial object containment - should find John's record
				partialObjectMatch: listFoo(filter: { data: { includes: { name: "John" } } }) {
					id
					data
				}

				# Test nested object containment - should find record with config object
				nestedObjectMatch: listFoo(filter: { data: { includes: { config: { theme: "dark" } } } }) {
					id
					data
				}

				# Test array subset containment - should find number array containing [2, 3]
				arraySubsetMatch: listFoo(filter: { data: { includes: [2, 3] } }) {
					id
					data
				}

				# Test single element containment - works for primitive values in arrays
				singleElementMatch: listFoo(filter: { data: { includes: 2 } }) {
					id
					data
				}

				# Test object with array subset
				objectArrayMatch: listFoo(filter: { data: { includes: { tags: ["red"] } } }) {
					id
					data
				}

				# Test array of objects containment - should find array containing the object
				arrayObjectMatch: listFoo(filter: { data: { includes: [{ id: 1, name: "Product A" }] } }) {
					id
					data
				}

				# Test non-matching includes
				noMatch: listFoo(filter: { data: { includes: { nonexistent: "value" } } }) {
					id
					data
				}
			}
		`,
	)
		.expect(response => {
			const data = response.body.data

			// Verify partial object containment found John's record
			expect(data.partialObjectMatch).toHaveLength(1)

			// Verify nested object containment found the config record
			expect(data.nestedObjectMatch).toHaveLength(1)

			// Verify array subset containment found the number array
			expect(data.arraySubsetMatch).toHaveLength(1)

			// Single element containment works for primitive values in arrays
			expect(data.singleElementMatch).toHaveLength(1)

			// Verify object with array subset works
			expect(data.objectArrayMatch).toHaveLength(1)

			// Array of objects containment works too
			expect(data.arrayObjectMatch).toHaveLength(1)

			// Verify no matches for non-existent value
			expect(data.noMatch).toHaveLength(0)
		})
		.expect(200)
})
