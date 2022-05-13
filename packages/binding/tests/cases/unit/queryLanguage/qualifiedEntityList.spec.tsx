import { expect, it, describe } from 'vitest'
import { Environment } from '../../../../src/dao'
import { Parser } from '../../../../src/queryLanguage'

const parse = (input: string) => {
	return Parser.parseQueryLanguageExpression(input, 'qualifiedEntityList', Environment.create())
}

describe('qualified entity list QueryLanguage parser', () => {
	it('Should parse just the entity name', () => {
		expect(parse('Author')).toEqual({
			entityName: 'Author',
			filter: undefined,
			hasOneRelationPath: [],
		})
	})

	it('should parse a qualified field list up to an entity', () => {
		expect(parse(`Author[age > 20 && homeTown = 'Prague'].son.sisters(name = 'Jane')`)).toEqual({
			entityName: 'Author',
			filter: {
				and: [{ age: { gt: 20 } }, { homeTown: { eq: 'Prague' } }],
			},
			hasOneRelationPath: [
				{ field: 'son', filter: undefined, reducedBy: undefined },
				{ field: 'sisters', filter: undefined, reducedBy: { name: 'Jane' } },
			],
		})
	})
})
