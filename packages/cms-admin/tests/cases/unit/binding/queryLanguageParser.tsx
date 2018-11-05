import { expect } from 'chai'
import { GraphQlBuilder } from 'cms-client'
import 'mocha'
import * as React from 'react'
import { ToOne } from '../../../../src/binding/coreComponents'
import { TextField } from '../../../../src/binding/facade'
import { Parser } from '../../../../src/binding/queryLanguage'

describe('query language parser', () => {
	it('should parse single field names', () => {
		expect(Parser.parseQueryLanguageExpression('fooName')).eql({
			fieldName: 'fooName',
			toOneProps: []
		})
	})

	it('should parse single relation with a name', () => {
		expect(Parser.parseQueryLanguageExpression('fooRelation.fooName')).eql({
			fieldName: 'fooName',
			toOneProps: [
				{
					field: 'fooRelation'
				}
			]
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
		const result = Parser.generateWrappedField('this(better=work).as.expected(and = 1).correctly', name => (
			<TextField name={name} />
		))
		const expected = (
			<ToOne field="this" reducedBy={{ better: new GraphQlBuilder.Literal('work') }}>
				<ToOne field="as">
					<ToOne field="expected" reducedBy={{ and: 1 }}>
						<TextField name="correctly" />
					</ToOne>
				</ToOne>
			</ToOne>
		)
		expect(result).eql(expected)
	})
})
