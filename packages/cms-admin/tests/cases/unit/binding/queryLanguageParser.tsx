import { expect } from 'chai'
import { GraphQlBuilder } from 'cms-client'
import 'mocha'
import * as React from 'react'
import { ToOne } from '../../../../src/binding/coreComponents'
import { Environment } from '../../../../src/binding/dao'
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

	it('should parse composite unique where', () => {
		expect(Parser.parseQueryLanguageExpression("foo(a='b', bar = 123).name")).eql({
			fieldName: 'name',
			toOneProps: [
				{
					field: 'foo',
					reducedBy: {
						a: 'b',
						bar: 123
					}
				}
			]
		})
	})

	it('should reject duplicate fields in unique where', () => {
		expect(() => Parser.parseQueryLanguageExpression("foo(a='b', a = 123).name")).throws(/duplicate/i)
	})

	it('should parse nested unique where', () => {
		expect(
			Parser.parseQueryLanguageExpression(
				'foo(nested.structure.is.deep = 123, nested.structure.be.indeed.not.shallow = baz).name'
			)
		).eql({
			fieldName: 'name',
			toOneProps: [
				{
					field: 'foo',
					reducedBy: {
						nested: {
							structure: {
								is: {
									deep: 123
								},
								be: {
									indeed: {
										not: {
											shallow: new GraphQlBuilder.Literal('baz')
										}
									}
								}
							}
						}
					}
				}
			]
		})
	})

	it('should reject malformed nested unique where', () => {
		expect(() =>
			Parser.parseQueryLanguageExpression('foo(nested.field = 123, nested.field.treated.as.relation = baz).name')
		).throws(/'nested\.field'/i)
		expect(() => Parser.parseQueryLanguageExpression('foo(nested.field = 123, nested.field = baz).name')).throws(
			/'nested\.field'/i
		)
	})

	it('should correctly generate JSX', () => {
		const result = Parser.generateWrappedNode('this(better=work).as.expected(and = 1).correctly', name => (
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

	it('should resolve variables adhering to the principle maximal munch', () => {
		expect(Parser.generateWrappedNode('a(a=$a).ab(ab = $ab).x(x = $x).foo', name => (
			<TextField name={name} />
		), new Environment({
			ab: 456,
			a: 123,
			x: "'x'",
			dimensions: {}
		}))).eql((
			<ToOne field="a" reducedBy={{ a: 123 }}>
				<ToOne field="ab" reducedBy={{ ab: 456 }}>
					<ToOne field="x" reducedBy={{ x: 'x' }}>
						<TextField name="foo" />
					</ToOne>
				</ToOne>
			</ToOne>
		))
	})

	it('should resolve variables with multiple levels of replacement', () => {
		expect(Parser.generateWrappedNode('a($a).foo', name => (
			<TextField name={name} />
		), new Environment({
			ab: 456,
			a: 'ab = $ab',
			dimensions: {}
		}))).eql((
			<ToOne field="a" reducedBy={{ ab: 456 }}>
				<TextField name="foo" />
			</ToOne>
		))
	})
})
