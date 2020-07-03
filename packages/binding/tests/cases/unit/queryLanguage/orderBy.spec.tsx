import { GraphQlBuilder } from '@contember/client'
import { Environment } from '../../../../src/dao'
import { Parser } from '../../../../src/queryLanguage'

const parse = (input: string) => {
	return Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.OrderBy, new Environment())
}

describe('orderBy QueryLanguage parser', () => {
	it('should parse single field names', () => {
		expect(parse('fooName')).toEqual([{ fooName: new GraphQlBuilder.Literal('asc') }])
	})

	it('should parse nested field names', () => {
		expect(parse('fooName.barName.bazName')).toEqual([
			{ fooName: { barName: { bazName: new GraphQlBuilder.Literal('asc') } } },
		])
	})

	it('should parse multiple field names', () => {
		expect(parse('foo.bar, baz, x.y.z')).toEqual([
			{ foo: { bar: new GraphQlBuilder.Literal('asc') } },
			{ baz: new GraphQlBuilder.Literal('asc') },
			{ x: { y: { z: new GraphQlBuilder.Literal('asc') } } },
		])
	})

	it('should parse order directions', () => {
		expect(parse('foo asc, bar desc')).toEqual([
			{ foo: new GraphQlBuilder.Literal('asc') },
			{ bar: new GraphQlBuilder.Literal('desc') },
		])

		expect(parse('foo.bar asc, a.b.c desc')).toEqual([
			{ foo: { bar: new GraphQlBuilder.Literal('asc') } },
			{ a: { b: { c: new GraphQlBuilder.Literal('desc') } } },
		])
	})

	it('should parse order with odd whitespace use', () => {
		expect(parse('  \t foo.bar ,baz desc, \t x.y.z\t  \t  desc   ')).toEqual([
			{ foo: { bar: new GraphQlBuilder.Literal('asc') } },
			{ baz: new GraphQlBuilder.Literal('desc') },
			{ x: { y: { z: new GraphQlBuilder.Literal('desc') } } },
		])
	})
})
