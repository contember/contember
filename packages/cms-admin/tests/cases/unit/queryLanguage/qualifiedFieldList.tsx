import { expect } from 'chai'
import 'mocha'
import * as React from 'react'
import { Parser } from '../../../../src/binding/queryLanguage'

const parse = (input: string) => {
	return Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.QualifiedFieldList)
}

describe('qualified field list QueryLanguage parser', () => {
	it('should parse a complete qualified field list', () => {
		expect(parse("Author[age > 20].children[name != 'james'].name")).eql({
			entityName: 'Author',
			filter: {
				age: { gt: 20 }
			},
			toOneProps: [],
			toManyProps: {
				field: 'children',
				filter: {
					name: { notEq: 'james' }
				}
			},
			fieldName: 'name'
		})
	})
})
