import { expect } from 'chai'
import { GraphQlBuilder } from 'cms-client'
import 'mocha'
import * as React from 'react'
import ToOne from '../../../../src/binding/coreComponents/ToOne'
import TextField from '../../../../src/binding/facade/TextField'
import Parser from '../../../../src/binding/queryLanguage/Parser'

describe('query language parser', () => {
	it('should parse single field naems', () => {
		expect(Parser.parseQueryLanguageExpression('fooName')).eql({
			fieldName: 'fooName',
			toOneProps: []
		})
	})

	it('should parse a chain of fields without wheres', () => {
		expect(Parser.parseQueryLanguageExpression('foo.bar.baz.name')).eql({
			fieldName: 'name',
			toOneProps: [
				{
					field: 'foo'
				},
				{
					field: 'bar'
				},
				{
					field: 'baz'
				}
			]
		})
	})

	it('should parse unique where', () => {
		expect(Parser.parseQueryLanguageExpression("foo.bar(a='b').name")).eql({
			fieldName: 'name',
			toOneProps: [
				{
					field: 'foo'
				},
				{
					field: 'bar',
					reducedBy: {
						a: 'b'
					}
				}
			]
		})
	})

	it('should correctly generate JSX', () => {
		const result = Parser.generateWrappedField('this(better=work).as.expected(and = 1).correctly', name => <TextField name={name} />)
		const expected = <ToOne field="this" reducedBy={{better: new GraphQlBuilder.Literal('work')}}>
			<ToOne field="as">
				<ToOne field="expected" reducedBy={{and: 1}}>
					<TextField name="correctly" />
				</ToOne>
			</ToOne>
		</ToOne>
		expect(
			result
		).eql(
			expected
		)
	})
})
