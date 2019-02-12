import { expect } from 'chai'
import 'mocha'
import * as React from 'react'
import { Parser } from '../../../../src/binding/queryLanguage'

const parse = (input: string): Parser.AST.RelativeEntityList['toManyProps'] => {
	return Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.RelativeEntityList).toManyProps
}

describe('relative entity list QueryLanguage parser', () => {
	it('should parse unconstrained fields', () => {
		expect(parse('foo.bar.baz')).eql([
			{
				field: 'foo'
			},
			{
				field: 'bar'
			},
			{
				field: 'baz'
			}
		])
	})

	it('should parse simple conditions', () => {
		expect(parse('foo[bar = 123]')).eql([
			{
				field: 'foo',
				filter: {
					bar: { eq: 123 }
				}
			}
		])
	})

	it('should parse multiple filter conditions', () => {
		const expected = [
			{
				field: 'foo',
				filter: {
					and: [{ bar: { eq: 'value' } }, { baz: { gte: 456 } }]
				}
			}
		]
		expect(parse("foo[bar = 'value'][baz >= 456]")).eql(expected)
		expect(parse("foo[bar = 'value' && baz >= 456]")).eql(expected)
	})

	it('should parse complex filter conditions', () => {
		expect(parse('foo[a < 1 || b = 2 && c != 3 || d > 4]')).eql([
			{
				field: 'foo',
				filter: {
					or: [
						{ a: { lt: 1 } },
						{
							and: [{ b: { eq: 2 } }, { c: { notEq: 3 } }]
						},
						{
							d: { gt: 4 }
						}
					]
				}
			}
		])
	})
})
