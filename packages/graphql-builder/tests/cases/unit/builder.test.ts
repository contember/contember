import { describe, expect, test } from 'vitest'
import { GraphQlField, GraphQlQueryPrinter } from '../../../src'

describe('builder', () => {

	test('fetch field', async () => {
		const printer = new GraphQlQueryPrinter()
		const result = printer.printDocument('query', [
			new GraphQlField(null, 'test', {}),
		],  {})
		expect(result).toMatchInlineSnapshot(`
			{
			  "query": "query {
				test
			}
			",
			  "variables": {},
			}
		`)
	})

	test('variable deduplication', async () => {
		const printer = new GraphQlQueryPrinter()
		const someValue = { foo: 'bar' }
		const result = printer.printDocument('query', [
			new GraphQlField('b', 'test', {
				variable: { graphQlType: 'Json', value: someValue },
			}),
			new GraphQlField('a', 'test', {
				variable: { graphQlType: 'Json', value: someValue },
			}),
		],  {})
		expect(result).toMatchInlineSnapshot(`
			{
			  "query": "query($Json_0: Json) {
				b: test(variable: $Json_0)
				a: test(variable: $Json_0)
			}
			",
			  "variables": {
			    "Json_0": {
			      "foo": "bar",
			    },
			  },
			}
		`)

	})
})
