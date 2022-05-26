import { expect, it, describe } from 'vitest'
import { Environment } from '../../../../src/dao'
import { Parser } from '../../../../src/queryLanguage'
import type { ParsedTaggedMap } from '../../../../src/queryLanguage/ParserResults'

const parse = (input: string): ParsedTaggedMap => {
	return Parser.parseQueryLanguageExpression(input, 'taggedMap', Environment.create())
}

describe('tagged map QueryLanguage parser', () => {
	it('should parse literal parameters', () => {
		expect(parse("foo(bar: 'lorem')")).toEqual({
			name: 'foo',
			entries: [
				{
					key: 'bar',
					value: {
						type: 'literal',
						value: 'lorem',
					},
				},
			],

		})
	})

	it('should parse variable parameters', () => {
		expect(parse('foo(bar: $lorem.ipsum)')).toEqual({
			name: 'foo',
			entries: [
				{
					key: 'bar',
					value: {
						type: 'variable',
						value: 'lorem.ipsum',
					},
				},
			],
		})
	})
})
