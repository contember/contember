import { describe, expect, test } from 'bun:test'
import * as graphqlJs from 'graphql'
import { buildSchema as buildGraphQLJsSchema, parse } from 'graphql'
import { didYouMean as graphqlJsDidYouMean } from 'graphql/jsutils/didYouMean.js'
import { suggestionList as graphqlJsSuggestionList } from 'graphql/jsutils/suggestionList.js'
import { buildSchema, didYouMean, suggestionList, type ValidationRule } from '../../src/index.js'
import { validate } from '../../src/validation/validate.js'
import { FieldsOnCorrectTypeRule } from '../../src/validation/rules/FieldsOnCorrectTypeRule.js'

const sdl = `
	interface Node { id: ID! }
	interface Named implements Node { id: ID! name: String }
	type Person implements Node & Named { id: ID! name: String age: Int }
	type Robot implements Node & Named { id: ID! name: String model: String }
	type Item2 implements Node { id: ID! label: String }
	type Item10 implements Node { id: ID! label: String }
	union Thing = Person | Robot | Item2 | Item10
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
