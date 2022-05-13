import { expect, it, describe } from 'vitest'
import { GraphQlLiteral } from '@contember/client'
import { Environment } from '../../../../src/dao'
import { Parser } from '../../../../src/queryLanguage'

const parse = (input: string) => {
	return Parser.parseQueryLanguageExpression(input, 'relativeSingleField', Environment.create())
}

describe('single relative fields QueryLanguage parser', () => {
	it('should parse single field names', () => {
		expect(parse('fooName')).toEqual({
			field: 'fooName',
			hasOneRelationPath: [],
		})
	})

	it('should parse single relation with a name', () => {
		expect(parse('fooRelation.fooName')).toEqual({
			field: 'fooName',
			hasOneRelationPath: [
				{
					field: 'fooRelation',
					filter: undefined,
					reducedBy: undefined,
				},
			],
		})
	})

	it('should parse a chain of fields without wheres', () => {
		expect(parse('foo.bar.baz.name')).toEqual({
			field: 'name',
			hasOneRelationPath: [
				{
					field: 'foo',
					filter: undefined,
					reducedBy: undefined,
				},
				{
					field: 'bar',
					filter: undefined,
					reducedBy: undefined,
				},
				{
					field: 'baz',
					filter: undefined,
					reducedBy: undefined,
				},
			],
		})
	})

	it('should parse unique where', () => {
		expect(parse("foo.bar(a='b').name")).toEqual({
			field: 'name',
			hasOneRelationPath: [
				{
					field: 'foo',
					filter: undefined,
					reducedBy: undefined,
				},
				{
					field: 'bar',
					filter: undefined,
					reducedBy: {
						a: 'b',
					},
				},
			],
		})
	})

	it('should parse composite unique where', () => {
		expect(parse("foo(a='b', bar = Literal).name")).toEqual({
			field: 'name',
			hasOneRelationPath: [
				{
					field: 'foo',
					filter: undefined,
					reducedBy: {
						a: 'b',
						bar: new GraphQlLiteral('Literal'),
					},
				},
			],
		})
	})

	it('should reject duplicate fields in unique where', () => {
		expect(() => parse("foo(a='b', a = 123).name")).toThrowError(/duplicate/i)
	})

	it('should reject relation fields at the end', () => {
		expect(() => parse("foo(a='b')")).toThrowError(/relation/i)
	})

	it('should parse nested unique where', () => {
		expect(parse('foo(nested.structure.is.deep = 123, nested.structure.be.indeed.not.shallow = baz).name')).toEqual({
			field: 'name',
			hasOneRelationPath: [
				{
					field: 'foo',
					filter: undefined,
					reducedBy: {
						nested: {
							structure: {
								is: {
									deep: 123,
								},
								be: {
									indeed: {
										not: {
											shallow: new GraphQlLiteral('baz'),
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
		expect(() => parse('foo(nested.field = 123, nested.field.treated.as.relation = baz).name')).toThrowError(
			/'nested\.field'/i,
		)
		expect(() => parse('foo(nested.field = 123, nested.field = baz).name')).toThrowError(/'nested\.field'/i)
	})
})
