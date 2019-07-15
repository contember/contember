import { expect } from 'chai'
import 'mocha'
import { Environment } from '../../../../src/binding/dao'
import { Parser } from '../../../../src/binding/queryLanguage'

const parse = (input: string): Parser.AST.RelativeEntityList => {
	return Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.RelativeEntityList, new Environment())
}

describe('relative entity list QueryLanguage parser', () => {
	it('should parse unconstrained fields', () => {
		expect(parse('foo.bar.baz')).eql({
			toOneProps: [{ field: 'foo' }, { field: 'bar' }],
			toManyProps: {
				field: 'baz'
			}
		})
	})

	it('should parse simple conditions', () => {
		expect(parse('foo[bar = 123]')).eql({
			toOneProps: [],
			toManyProps: {
				field: 'foo',
				filter: {
					bar: { eq: 123 }
				}
			}
		})
	})

	it('should parse multiple filter conditions', () => {
		const expected = {
			toOneProps: [],
			toManyProps: {
				field: 'foo',
				filter: {
					and: [{ bar: { eq: 'value' } }, { baz: { gte: 456 } }]
				}
			}
		}
		expect(parse("foo[bar = 'value'][baz >= 456]")).eql(expected)
		expect(parse("foo[bar = 'value' && baz >= 456]")).eql(expected)
	})

	it('should parse complex filter conditions', () => {
		expect(parse('foo[a < 1 || b = 2 && c != 3 || d > 4]')).eql({
			toOneProps: [],
			toManyProps: {
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
		})
	})

	it('should parse conditions with nested fields', () => {
		expect(parse('foo[a.b.c < 123 && a.d = 456]')).eql({
			toOneProps: [],
			toManyProps: {
				field: 'foo',
				filter: {
					and: [{ a: { b: { c: { lt: 123 } } } }, { a: { d: { eq: 456 } } }]
				}
			}
		})
	})
})
