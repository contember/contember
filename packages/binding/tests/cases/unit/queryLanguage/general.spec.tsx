import { expect, it, describe } from 'vitest'
import { GraphQlBuilder } from '@contember/client'
import { Environment } from '../../../../src/dao'
import { Parser } from '../../../../src/queryLanguage'

describe('query language parser', () => {
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
					reducedBy: { ab: 456, literalColumn: new GraphQlBuilder.GraphQlLiteral('literal') },
				},
				{
					field: 'x',
					filter: undefined,
					reducedBy: { x: new GraphQlBuilder.GraphQlLiteral('truecolor') },
				},
			],
		})
	})
})
