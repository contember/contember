import { Environment } from '../../../../src/dao'
import { Parser } from '../../../../src/queryLanguage'
import type { DesugaredRelativeEntityList } from '../../../../src/treeParameters'

const parse = (input: string): DesugaredRelativeEntityList => {
	return Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.RelativeEntityList, new Environment())
}

describe('relative entity list QueryLanguage parser', () => {
	it('should parse unconstrained fields', () => {
		expect(parse('foo.bar.baz')).toEqual({
			hasOneRelationPath: [
				{ field: 'foo', filter: undefined, reducedBy: undefined },
				{ field: 'bar', filter: undefined, reducedBy: undefined },
			],
			hasManyRelation: {
				field: 'baz',
				filter: undefined,
			},
		})
	})

	it('should parse simple conditions', () => {
		expect(parse('foo[bar = 123]')).toEqual({
			hasOneRelationPath: [],
			hasManyRelation: {
				field: 'foo',
				filter: {
					bar: { eq: 123 },
				},
			},
		})
	})

	it('should parse multiple filter conditions', () => {
		const expected = {
			hasOneRelationPath: [],
			hasManyRelation: {
				field: 'foo',
				filter: {
					and: [{ bar: { eq: 'value' } }, { baz: { gte: 456 } }],
				},
			},
		}
		expect(parse("foo[bar = 'value'][baz >= 456]")).toEqual(expected)
		expect(parse("foo[bar = 'value' && baz >= 456]")).toEqual(expected)
	})
})
