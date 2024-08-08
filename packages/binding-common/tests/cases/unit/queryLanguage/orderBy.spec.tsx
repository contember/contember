import { expect, it, describe } from 'vitest'
import { GraphQlBuilder } from '@contember/client'
import { Environment } from '../../../../src/environment'
import { Parser } from '../../../../src/queryLanguage'

const parse = (input: string) => {
	return Parser.parseQueryLanguageExpression(input, 'orderBy', Environment.create())
}

describe('orderBy QueryLanguage parser', () => {
	it('should parse single field names', () => {
		expect(parse('fooName')).toEqual([{ fooName: 'asc' }])
	})

	it('should parse nested field names', () => {
		expect(parse('fooName.barName.bazName')).toEqual([
			{ fooName: { barName: { bazName: 'asc' } } },
		])
	})

	it('should parse multiple field names', () => {
		expect(parse('foo.bar, baz, x.y.z')).toEqual([
			{ foo: { bar: 'asc' } },
			{ baz: 'asc' },
			{ x: { y: { z: 'asc' } } },
		])
	})

	it('should parse order directions', () => {
		expect(parse('foo asc, bar desc')).toEqual([
			{ foo: 'asc' },
			{ bar: 'desc' },
		])

		expect(parse('foo.bar asc, a.b.c desc')).toEqual([
			{ foo: { bar: 'asc' } },
			{ a: { b: { c: 'desc' } } },
		])
	})

	it('should parse order with odd whitespace use', () => {
		expect(parse('  \t foo.bar ,baz desc, \t x.y.z\t  \t  desc   ')).toEqual([
			{ foo: { bar: 'asc' } },
			{ baz: 'desc' },
			{ x: { y: { z: 'desc' } } },
		])
	})
})
