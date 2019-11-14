import 'jasmine'
import { Environment } from '../../../../src/binding/dao'
import { Parser } from '../../../../src/binding/queryLanguage'

const parse = (input: string) => {
	return Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.QualifiedEntityList, new Environment())
}

describe('qualified entity list QueryLanguage parser', () => {
	it('Should parse just the entity name', () => {
		expect(parse('Author')).toEqual({
			entityName: 'Author',
			filter: undefined,
			toOneProps: [],
		})
	})

	it('should parse a qualified field list up to an entity', () => {
		expect(parse(`Author[age > 20 && homeTown = 'Prague'].son.sisters(name = 'Jane')`)).toEqual({
			entityName: 'Author',
			filter: {
				and: [{ age: { gt: 20 } }, { homeTown: { eq: 'Prague' } }],
			},
			toOneProps: [{ field: 'son' }, { field: 'sisters', reducedBy: { name: 'Jane' } }],
		})
	})
})
