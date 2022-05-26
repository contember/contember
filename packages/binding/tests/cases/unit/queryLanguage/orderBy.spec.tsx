import { expect, it, describe } from 'vitest'
import { GraphQlBuilder } from '@contember/client'
import { Environment } from '../../../../src/dao'
import { Parser } from '../../../../src/queryLanguage'

const parse = (input: string) => {
	return Parser.parseQueryLanguageExpression(input, 'orderBy', Environment.create())
}

describe('orderBy QueryLanguage parser', () => {
	it('should parse single field names', () => {
		expect(parse('fooName')).toEqual([{ fooName: new GraphQlBuilder.GraphQlLiteral('asc') }])
	})

	it('should parse nested field names', () => {
		expect(parse('fooName.barName.bazName')).toEqual([
			{ fooName: { barName: { bazName: new GraphQlBuilder.GraphQlLiteral('asc') } } },
		])
	})

	it('should parse multiple field names', () => {
		expect(parse('foo.bar, baz, x.y.z')).toEqual([
			{ foo: { bar: new GraphQlBuilder.GraphQlLiteral('asc') } },
			{ baz: new GraphQlBuilder.GraphQlLiteral('asc') },
			{ x: { y: { z: new GraphQlBuilder.GraphQlLiteral('asc') } } },
		])
	})

	it('should parse order directions', () => {
		expect(parse('foo asc, bar desc')).toEqual([
			{ foo: new GraphQlBuilder.GraphQlLiteral('asc') },
			{ bar: new GraphQlBuilder.GraphQlLiteral('desc') },
		])

		expect(parse('foo.bar asc, a.b.c desc')).toEqual([
			{ foo: { bar: new GraphQlBuilder.GraphQlLiteral('asc') } },
			{ a: { b: { c: new GraphQlBuilder.GraphQlLiteral('desc') } } },
		])
	})

	it('should parse order with odd whitespace use', () => {
		expect(parse('  \t foo.bar ,baz desc, \t x.y.z\t  \t  desc   ')).toEqual([
			{ foo: { bar: new GraphQlBuilder.GraphQlLiteral('asc') } },
			{ baz: new GraphQlBuilder.GraphQlLiteral('desc') },
			{ x: { y: { z: new GraphQlBuilder.GraphQlLiteral('desc') } } },
		])
	})
})
