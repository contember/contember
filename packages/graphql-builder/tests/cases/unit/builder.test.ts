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
})
