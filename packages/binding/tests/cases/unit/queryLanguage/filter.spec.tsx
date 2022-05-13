import { expect, it, describe } from 'vitest'
import { Environment } from '../../../../src/dao'
import { Parser } from '../../../../src/queryLanguage'

const parse = (input: string, environment: Environment = Environment.create()) => {
	return Parser.parseQueryLanguageExpression(input, 'filter', environment)
}

describe('filter QueryLanguage parser', () => {
	it('should parse simple filters', () => {
		expect(parse('[foo > 123]')).toEqual({ foo: { gt: 123 } })
		expect(parse('[foo = 456]')).toEqual({ foo: { eq: 456 } })
		expect(parse('[foo != 456]')).toEqual({ foo: { notEq: 456 } })
		expect(parse('[foo <= 789]')).toEqual({ foo: { lte: 789 } })
	})

	it('should parse variable filters', () => {
		const myEnv = Environment.create().withVariables({
			myFilter: { foo: { eq: 123 } },
		})
		expect(parse('[$myFilter]', myEnv)).toEqual({ foo: { eq: 123 } })
		expect(parse('[!$myFilter]', myEnv)).toEqual({ not: { foo: { eq: 123 } } })
	})

	it('should parse filter sub expressions', () => {
		const myEnv = Environment.create().withVariables({
			myFilter: { foo: { eq: 123 } },
		})
		expect(parse('[!($myFilter || x < 456)]', myEnv)).toEqual({
			not: {
				or: [{ foo: { eq: 123 } }, { x: { lt: 456 } }],
			},
		})
	})

	it('should parse complex filter conditions', () => {
		expect(parse('[a < 1 || b = 2 && c != 3 || d > 4]')).toEqual({
			or: [
				{ a: { lt: 1 } },
				{
					and: [{ b: { eq: 2 } }, { c: { notEq: 3 } }],
				},
				{
					d: { gt: 4 },
				},
			],
		})
	})

	it('should parse conditions with nested fields', () => {
		expect(parse('[a.b.c < 123 && a.d = 456]')).toEqual({
			and: [{ a: { b: { c: { lt: 123 } } } }, { a: { d: { eq: 456 } } }],
		})
	})
})
