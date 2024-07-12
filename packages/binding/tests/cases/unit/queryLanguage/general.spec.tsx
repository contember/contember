import { expect, it, describe } from 'vitest'
import { GraphQlBuilder } from '@contember/client'
import { Environment } from '../../../../src/dao'
import { Parser } from '../../../../src/queryLanguage'

describe('query language parser', () => {
	it('shoud parse column value', () => {
		const env = Environment.create()
		expect(Parser.parseQueryLanguageExpression('123', 'columnValue', env)).toEqual(123)
		expect(Parser.parseQueryLanguageExpression('123.456', 'columnValue', env)).toEqual(123.456)
		expect(Parser.parseQueryLanguageExpression('true', 'columnValue', env)).toEqual(true)
		expect(Parser.parseQueryLanguageExpression('false', 'columnValue', env)).toEqual(false)
		expect(Parser.parseQueryLanguageExpression('null', 'columnValue', env)).toEqual(null)
		expect(Parser.parseQueryLanguageExpression("'foo'", 'columnValue', env)).toEqual('foo')
		expect(Parser.parseQueryLanguageExpression(`'foo\\'bar'`, 'columnValue', env)).toEqual("foo'bar")
		expect(Parser.parseQueryLanguageExpression(`'foo"bar'`, 'columnValue', env)).toEqual(`foo"bar`)
		expect(Parser.parseQueryLanguageExpression(`'foo\\"bar'`, 'columnValue', env)).toEqual(`foo"bar`)
		expect(Parser.parseQueryLanguageExpression('"foo"', 'columnValue', env)).toEqual('foo')
		expect(Parser.parseQueryLanguageExpression(`"foo\\"bar"`, 'columnValue', env)).toEqual('foo"bar')
		expect(Parser.parseQueryLanguageExpression(`"foo\\'bar"`, 'columnValue', env)).toEqual("foo'bar")
		expect(Parser.parseQueryLanguageExpression(`"foo'bar"`, 'columnValue', env)).toEqual("foo'bar")
	})

	it('should resolve variables adhering to the principle maximal munch', () => {
		const environment = Environment.create().withVariables({
			ab: 456,
			a: 123,
			x: 'x',
			lit: new GraphQlBuilder.GraphQlLiteral('lit'),
			literal: new GraphQlBuilder.GraphQlLiteral('literal'),
		})
		expect(
			Parser.parseQueryLanguageExpression(
				'a(a=$a).field(ab = $ab, literalColumn = $literal).x(x = truecolor).foo',
				'relativeSingleField',
				environment,
			),
		).toEqual({
			field: 'foo',
			hasOneRelationPath: [
				{
					field: 'a',
					filter: undefined,
					reducedBy: { a: 123 },
				},
				{
					field: 'field',
					filter: undefined,
					reducedBy: { ab: 456, literalColumn: 'literal' },
				},
				{
					field: 'x',
					filter: undefined,
					reducedBy: { x: 'truecolor' },
				},
			],
		})
	})
})
