import { expect } from 'chai'
import { GraphQlBuilder } from 'cms-client'
import 'mocha'
import * as React from 'react'
import { ToOne } from '../../../../src/binding/coreComponents'
import { Environment } from '../../../../src/binding/dao'
import { TextField } from '../../../../src/binding/facade'
import { Parser, QueryLanguage } from '../../../../src/binding/queryLanguage'

const parse = (input: string) => {
	return Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.RelativeSingleField, new Environment())
}

describe('single relative fields QueryLanguage parser', () => {
	it('should parse single field names', () => {
		expect(parse('fooName')).eql({
			fieldName: 'fooName',
			toOneProps: [],
		})
	})

	it('should parse single relation with a name', () => {
		expect(parse('fooRelation.fooName')).eql({
			fieldName: 'fooName',
			toOneProps: [
				{
					field: 'fooRelation',
				},
			],
		})
	})

	it('should parse a chain of fields without wheres', () => {
		expect(parse('foo.bar.baz.name')).eql({
			fieldName: 'name',
			toOneProps: [
				{
					field: 'foo',
				},
				{
					field: 'bar',
				},
				{
					field: 'baz',
				},
			],
		})
	})

	it('should parse unique where', () => {
		expect(parse("foo.bar(a='b').name")).eql({
			fieldName: 'name',
			toOneProps: [
				{
					field: 'foo',
				},
				{
					field: 'bar',
					reducedBy: {
						a: 'b',
					},
				},
			],
		})
	})

	it('should parse composite unique where', () => {
		expect(parse("foo(a='b', bar = 123).name")).eql({
			fieldName: 'name',
			toOneProps: [
				{
					field: 'foo',
					reducedBy: {
						a: 'b',
						bar: 123,
					},
				},
			],
		})
	})

	it('should reject duplicate fields in unique where', () => {
		expect(() => parse("foo(a='b', a = 123).name")).throws(/duplicate/i)
	})

	it('should reject relation fields at the end', () => {
		expect(() => parse("foo(a='b')")).throws(/relation/i)
	})

	it('should parse nested unique where', () => {
		expect(parse('foo(nested.structure.is.deep = 123, nested.structure.be.indeed.not.shallow = baz).name')).eql({
			fieldName: 'name',
			toOneProps: [
				{
					field: 'foo',
					reducedBy: {
						nested: {
							structure: {
								is: {
									deep: 123,
								},
								be: {
									indeed: {
										not: {
											shallow: new GraphQlBuilder.Literal('baz'),
										},
									},
								},
							},
						},
					},
				},
			],
		})
	})

	it('should reject malformed nested unique where', () => {
		expect(() => parse('foo(nested.field = 123, nested.field.treated.as.relation = baz).name')).throws(
			/'nested\.field'/i,
		)
		expect(() => parse('foo(nested.field = 123, nested.field = baz).name')).throws(/'nested\.field'/i)
	})

	it('should correctly generate JSX', () => {
		const environment = new Environment()
		const result = QueryLanguage.wrapRelativeSingleField(
			'this(better=work).as.expected(and = 1).correctly',
			name => <TextField name={name} />,
			environment,
		)
		const expected = (
			<ToOne.AtomicPrimitive
				field="this"
				reducedBy={{ better: new GraphQlBuilder.Literal('work') }}
				environment={environment}
			>
				<ToOne.AtomicPrimitive field="as" environment={environment}>
					<ToOne.AtomicPrimitive field="expected" reducedBy={{ and: 1 }} environment={environment}>
						<TextField name="correctly" />
					</ToOne.AtomicPrimitive>
				</ToOne.AtomicPrimitive>
			</ToOne.AtomicPrimitive>
		)
		expect(result).eql(expected)
	})
})
