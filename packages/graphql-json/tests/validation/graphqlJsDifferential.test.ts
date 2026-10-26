import { describe, expect, test } from 'bun:test'
import * as graphqlJs from 'graphql'
import { buildSchema as buildGraphQLJsSchema, parse } from 'graphql'
import { didYouMean as graphqlJsDidYouMean } from 'graphql/jsutils/didYouMean.js'
import { suggestionList as graphqlJsSuggestionList } from 'graphql/jsutils/suggestionList.js'
import { buildSchema, didYouMean, suggestionList, type ValidationRule } from '../../src/index.js'
import { validate } from '../../src/validation/validate.js'
import { FieldsOnCorrectTypeRule } from '../../src/validation/rules/FieldsOnCorrectTypeRule.js'
import { ValuesOfCorrectTypeRule } from '../../src/validation/rules/ValuesOfCorrectTypeRule.js'
import { KnownArgumentNamesRule } from '../../src/validation/rules/KnownArgumentNamesRule.js'
import { KnownDirectivesRule } from '../../src/validation/rules/KnownDirectivesRule.js'
import { ProvidedRequiredArgumentsRule } from '../../src/validation/rules/ProvidedRequiredArgumentsRule.js'
import { ScalarLeafsRule } from '../../src/validation/rules/ScalarLeafsRule.js'
import { VariablesAreInputTypesRule } from '../../src/validation/rules/VariablesAreInputTypesRule.js'
import { VariablesInAllowedPositionRule } from '../../src/validation/rules/VariablesInAllowedPositionRule.js'

const sdl = `
	interface Node { id: ID! }
	interface Named implements Node { id: ID! name: String }
	type Person implements Node & Named { id: ID! name: String age: Int }
	type Robot implements Node & Named { id: ID! name: String model: String }
	type Item2 implements Node { id: ID! label: String }
	type Item10 implements Node { id: ID! label: String }
	union Thing = Person | Robot | Item2 | Item10
	enum Color { RED GREEN BLUE }
	input Point { x: Int! y: Int = 0 }
	input Filter { name: String color: Color point: Point points: [Point!] }
	input Choice @oneOf { a: Int b: String }
	scalar Json
	type Query {
		node: Node
		named: Named
		thing: Thing
		person: Person
		listArticle: String
		getArticle: String
		listAuthor: String
		listTag: String
		paginateArticle: String
		listArticles: String
		listArticle2: String
		listArticle10: String
		required(by: Int!, other: String = "x", list: [Int!]!): String
		values(int: Int, ints: [Int], float: Float, str: String, bool: Boolean, id: ID, color: Color, filter: Filter, choice: Choice, json: Json): String
	}
`

const schema = buildSchema(sdl)
const graphqlJsSchema = buildGraphQLJsSchema(sdl)

const describeErrors = (errors: readonly graphqlJs.GraphQLError[]) => errors.map(error => error.toJSON())

/** Runs the rule and its graphql-js counterpart over the query and compares the reported errors */
const expectSameErrors = (rule: ValidationRule, graphqlJsRule: graphqlJs.ValidationRule, query: string) => {
	const document = parse(query)
	const expected = graphqlJs.validate(graphqlJsSchema, document, [graphqlJsRule])
	const actual = validate(schema, document, { rules: [rule] })
	expect(describeErrors(actual)).toEqual(describeErrors(expected))
	return expected
}

describe('FieldsOnCorrectTypeRule matches graphql-js', () => {
	const cases: Record<string, string> = {
		'field suggestions sorted by distance, then naturally, at most five': '{ listArticl }',
		'two field suggestions': '{ person { nme } }',
		'case change counts as one edit': '{ person { NAME } }',
		'transposition counts as one edit': '{ person { naem } }',
		'type suggestions on an interface': '{ node { name } }',
		'type suggestions on a union': '{ thing { label } }',
		'super interface before its implementations': '{ node { model } }',
		'no suggestions': '{ person { zzzzzzzz } }',
	}
	for (const [name, query] of Object.entries(cases)) {
		test(name, () => {
			expect(expectSameErrors(FieldsOnCorrectTypeRule, graphqlJs.FieldsOnCorrectTypeRule, query)).toHaveLength(1)
		})
	}
})

describe('suggestion helpers match graphql-js', () => {
	const options = ['listArticle', 'listArticle10', 'listArticle2', 'ListArticle', 'getArticle', 'listAuthor', 'tsilArticle', 'x']
	for (const input of ['listArticl', 'listarticle', 'listArticle1', 'lsitArticle', 'x', 'zzz']) {
		test(`suggestionList for "${input}"`, () => {
			expect(suggestionList(input, options)).toEqual(graphqlJsSuggestionList(input, options))
		})
	}
	for (const count of [0, 1, 2, 3, 5, 6]) {
		const suggestions = options.slice(0, count)
		test(`didYouMean with ${count} suggestions`, () => {
			expect(didYouMean(suggestions)).toBe(graphqlJsDidYouMean(suggestions))
			expect(didYouMean('the enum value', suggestions)).toBe(graphqlJsDidYouMean('the enum value', suggestions))
		})
	}
})

describe('ValuesOfCorrectTypeRule matches graphql-js', () => {
	const cases: Record<string, string> = {
		'a scalar parser error is reported as is': '{ values(int: "x", str: 1, bool: 1, id: true) }',
		'out of range and fractional numbers': '{ values(int: 2147483648, float: "1") }',
		'a string for an enum': '{ values(color: "RED") }',
		'an unknown enum value with a suggestion': '{ values(color: REDD) }',
		'a list for a non-list position is not traversed': '{ values(color: [RED, nope], int: [1]) }',
		'list items': '{ values(ints: [1, "x", null]) }',
		'a single value for a list': '{ values(ints: "x", filter: { points: { x: 1 } }) }',
		'missing required fields before unknown fields': '{ values(filter: { nme: "x", point: { z: 1 } }) }',
		'a scalar for an input object': '{ values(filter: 1) }',
		'null in a non-null position': '{ values(filter: { point: { x: null } }) }',
		'oneOf with two keys': '{ values(choice: { a: 1, b: "x" }) }',
		'oneOf with a null value': '{ values(choice: { a: null }) }',
		'a scalar without parsers accepts any literal': '{ values(json: { a: [1, B, null], b: "x" }) }',
		'a variable is not checked here': 'query($v: Int) { values(int: $v, filter: { name: $v }) }',
	}
	for (const [name, query] of Object.entries(cases)) {
		test(name, () => {
			expectSameErrors(ValuesOfCorrectTypeRule, graphqlJs.ValuesOfCorrectTypeRule, query)
		})
	}
})

const ruleCases: [name: string, rule: ValidationRule, graphqlJsRule: graphqlJs.ValidationRule, cases: Record<string, string>][] = [
	['KnownArgumentNamesRule', KnownArgumentNamesRule, graphqlJs.KnownArgumentNamesRule, {
		'an unknown field argument with suggestions': '{ required(byy: 1) }',
		'an unknown directive argument with suggestions': '{ person @skip(iff: true) { id } }',
		'arguments of an unknown directive': '{ person @nope(if: true) { id } }',
	}],
	['KnownDirectivesRule', KnownDirectivesRule, graphqlJs.KnownDirectivesRule, {
		'an unknown directive has no suggestions': '{ person @skp(if: true) { id } }',
		'a misplaced directive': 'query @skip(if: true) { person @deprecated { id } }',
		'the specified directives are known': '{ person @include(if: true) { id @skip(if: false) } }',
	}],
	['ProvidedRequiredArgumentsRule', ProvidedRequiredArgumentsRule, graphqlJs.ProvidedRequiredArgumentsRule, {
		'a missing field argument names the field only': '{ required(other: "y") }',
		'a missing directive argument': '{ person @skip { id } }',
		'arguments with defaults are optional': '{ required(by: 1, list: []) }',
	}],
	['ScalarLeafsRule', ScalarLeafsRule, graphqlJs.ScalarLeafsRule, {
		'a selection on a scalar': '{ listTag { x } }',
		'a missing selection': '{ person }',
	}],
	['VariablesAreInputTypesRule', VariablesAreInputTypesRule, graphqlJs.VariablesAreInputTypesRule, {
		'an output type variable': 'query($a: [Person!]!, $b: Thing) { listTag }',
	}],
	['VariablesInAllowedPositionRule', VariablesInAllowedPositionRule, graphqlJs.VariablesInAllowedPositionRule, {
		'a nullable variable in a non-null position': 'query($a: Int) { required(by: $a, list: [$a]) }',
		'a variable default allows a non-null position': 'query($a: Int = 1) { required(by: $a, list: []) }',
		'a null default does not': 'query($a: Int = null) { required(by: $a, list: []) }',
		'a location default allows a nullable variable': 'query($a: String) { required(by: 1, other: $a, list: []) }',
		'a nullable variable in a oneOf field': 'query($a: Int, $b: String!) { values(choice: { a: $a }) other: values(choice: { b: $b }) }',
		'a variable of an unknown type': 'query($a: Nope) { values(int: $a) }',
		'a variable used in a fragment': 'query($a: Boolean) { ...F } fragment F on Query { person @skip(if: $a) { id } }',
	}],
]

for (const [ruleName, rule, graphqlJsRule, cases] of ruleCases) {
	describe(`${ruleName} matches graphql-js`, () => {
		for (const [name, query] of Object.entries(cases)) {
			test(name, () => {
				expectSameErrors(rule, graphqlJsRule, query)
			})
		}
	})
}
