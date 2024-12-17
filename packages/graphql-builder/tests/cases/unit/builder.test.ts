import { describe, expect, test } from 'bun:test'
import { GraphQlField, GraphQlQueryPrinter } from '../../../src'

describe('builder', () => {

	test('fetch field', async () => {
		const printer = new GraphQlQueryPrinter()
		const result = printer.printDocument('query', [
			new GraphQlField(null, 'test', {}),
		],  {})
		expect(result).toMatchSnapshot()
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
		expect(result).toMatchSnapshot()

	})
})
