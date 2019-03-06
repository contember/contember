import { expect } from 'chai'
import 'mocha'
import { Parser } from '../../../../src/binding/queryLanguage'

const parse = (input: string) => {
	return Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.QualifiedFieldList)
}

describe('qualified field list QueryLanguage parser', () => {
	it('should parse a qualified field list in its simplest form', () => {
		expect(parse('Author.name')).eql({
			entityName: 'Author',
			filter: undefined,
			toOneProps: [],
			fieldName: 'name'
		})
	})

	it('should parse a complete qualified field list', () => {
		expect(parse('Author[age > 20].son.name')).eql({
			entityName: 'Author',
			filter: {
				age: { gt: 20 }
			},
			toOneProps: [{ field: 'son' }],
			fieldName: 'name'
		})
	})
})
