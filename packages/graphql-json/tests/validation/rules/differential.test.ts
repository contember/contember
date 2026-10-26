import { describe, expect, it } from 'bun:test'
import {
	buildSchema as buildGraphQLJsSchema,
	type GraphQLFormattedError,
	parse,
	specifiedRules as graphqlJsSpecifiedRules,
	validate as validateWithGraphQLJs,
} from 'graphql'
import { buildSchema, specifiedRules, validate } from '../../../src/index.js'

// Shaped like a content API schema: list/get/paginate fields with arguments, nested relations, an interface.
const sdl = `
	interface Node {
		id: UUID!
	}

	scalar UUID

	enum OrderDirection {
		asc
		desc
	}

	input ArticleOrderBy {
		title: OrderDirection
		publishedAt: OrderDirection
	}

	input ArticleWhere {
		id: UUIDCondition
		title: StringCondition
		and: [ArticleWhere!]
	}

	input UUIDCondition {
		eq: UUID
	}

	input StringCondition {
		eq: String
		contains: String
	}

	type Article implements Node {
		id: UUID!
		title: String
		lead: String
		publishedAt: String
		author: Author
		tags(limit: Int, orderBy: [ArticleOrderBy!]): [Tag!]!
		paginateTags(first: Int): TagConnection!
	}

	type Author implements Node {
		id: UUID!
		name: String!
		articles(limit: Int): [Article!]!
	}

	type Tag implements Node {
		id: UUID!
		name: String!
		articles: [Article!]!
	}

	type TagConnection {
		totalCount: Int!
		edges: [TagEdge!]!
	}

	type TagEdge {
		node: Tag!
	}

	type Query {
		getArticle(by: ArticleWhere!): Article
		listArticle(filter: ArticleWhere, orderBy: [ArticleOrderBy!], limit: Int, offset: Int): [Article!]!
		listAuthor(limit: Int): [Author!]!
		node(id: UUID!): Node
	}

	type Mutation {
		deleteArticle(by: ArticleWhere!): Article
	}

	type Subscription {
		articleChanged: Article
		authorChanged: Author
	}
`

const schema = buildSchema(sdl)
const graphqlJsSchema = buildGraphQLJsSchema(sdl)

function expectSameErrors(query: string, options?: { maxErrors?: number }): GraphQLFormattedError[] {
	const document = parse(query)
	const errors = validate(schema, document, { maxErrors: options?.maxErrors }).map((error) => error.toJSON())
	const graphqlJsErrors = validateWithGraphQLJs(graphqlJsSchema, document, graphqlJsSpecifiedRules, { maxErrors: options?.maxErrors })
		.map((error) => error.toJSON())
	expect(errors).toEqual(graphqlJsErrors)
	return errors
}

describe('validate matches graphql-js', () => {
	it('runs the rules of graphql-js specifiedRules', () => {
		expect(specifiedRules.map((rule) => rule.name)).toEqual(graphqlJsSpecifiedRules.map((rule) => rule.name))
	})

	it('rejects a response name selecting differently limited lists', () => {
		const errors = expectSameErrors(`{
			a: listArticle(limit: 1) { id }
			a: listArticle(limit: 2) { id }
		}`)
		expect(errors).toHaveLength(1)
	})

	it('rejects an alias of two different fields', () => {
		expect(expectSameErrors(`{ listArticle { title: lead title } }`)).toHaveLength(1)
	})

	it('rejects conflicting sub-selections through fragments', () => {
		expect(expectSameErrors(`
			query {
				listArticle(limit: 10) {
					...ArticleTags
					tags(limit: 2) { id }
				}
			}
			fragment ArticleTags on Article {
				tags(limit: 1) { id }
			}
		`)).toHaveLength(1)
	})

	it('rejects conflicting fields nested in fragments spread in separate fields', () => {
		expect(expectSameErrors(`
			query {
				listArticle {
					author { ...A }
					author { ...B }
				}
			}
			fragment A on Author { articles(limit: 1) { id } }
			fragment B on Author { articles(limit: 2) { id } }
		`)).toHaveLength(1)
	})

	it('accepts identical fields, also through fragments and inline fragments', () => {
		expect(expectSameErrors(`
			query ($id: UUID!) {
				getArticle(by: { id: { eq: $id } }) { id ...F ... on Article { title } }
				getArticle(by: { id: { eq: $id } }) { id title }
			}
			fragment F on Article { title tags(limit: 1, orderBy: [{ title: asc }]) { name } }
		`)).toEqual([])
	})

	it('compares input object arguments regardless of field order', () => {
		expect(expectSameErrors(`{
			a: listArticle(orderBy: [{ title: asc, publishedAt: desc }]) { id }
			a: listArticle(orderBy: [{ publishedAt: desc, title: asc }]) { id }
		}`)).toEqual([])
	})

	it('rejects the same field selected with and without arguments', () => {
		expect(expectSameErrors(`{ listArticle { id } listArticle(limit: 1) { id } }`)).toHaveLength(1)
	})

	it('accepts diverging fields on different object types and rejects them on an interface', () => {
		expect(expectSameErrors(`
			query ($id: UUID!) {
				node(id: $id) {
					... on Author { related: articles(limit: 1) { id } }
					... on Tag { related: articles { id } }
				}
			}
		`)).toEqual([])
		expect(expectSameErrors(`
			query ($id: UUID!) {
				node(id: $id) {
					... on Node { key: id }
					... on Author { key: name }
				}
			}
		`)).toHaveLength(1)
	})

	it('rejects conflicting return types and list-ness on different object types', () => {
		expect(expectSameErrors(`
			query ($id: UUID!) {
				node(id: $id) {
					... on Article { value: title }
					... on Author { value: articles { id } }
				}
			}
		`)).toHaveLength(1)
	})

	it('does not loop on fragment cycles', () => {
		expectSameErrors(`
			query { listArticle { ...A } }
			fragment A on Article { author { ...B } title }
			fragment B on Author { articles { ...A title: lead } }
		`)
	})

	it('rejects unused variables', () => {
		expect(expectSameErrors(`query Q($limit: Int, $offset: Int) { listArticle(limit: $limit) { id } }`)).toHaveLength(1)
	})

	it('rejects subscriptions selecting several or introspection root fields', () => {
		expect(expectSameErrors(`subscription { articleChanged { id } authorChanged { id } }`)).toHaveLength(1)
		expect(expectSameErrors(`subscription S { __typename }`)).toHaveLength(1)
		expect(expectSameErrors(`subscription S { articleChanged { id } ...F } fragment F on Subscription { authorChanged { id } }`)).toHaveLength(1)
	})

	it('rejects an unknown fragment named like an Object.prototype member', () => {
		expect(expectSameErrors(`subscription { ...toString }`)).toHaveLength(1)
	})

	it('rejects too deep introspection', () => {
		expect(expectSameErrors(`{ __schema { types { fields { type { fields { type { fields { name } } } } } } } }`)).toHaveLength(1)
	})

	it('ignores descriptions of executable definitions', () => {
		expect(expectSameErrors(`
			"Lists articles"
			query Q("limit of articles" $limit: Int) { listArticle(limit: $limit) { id } }
		`)).toEqual([])
	})

	it('reports errors of several rules in the same order', () => {
		expect(
			expectSameErrors(`
			query Q($unused: Int, $limit: Int) {
				a: listArticle(limit: $limit) { id unknown }
				a: listAuthor { id }
				...Missing
			}
			query Q { listAuthor { name } }
		`).length,
		).toBeGreaterThan(4)
	})

	it('aborts after maxErrors', () => {
		const query = `{ ${Array.from({ length: 150 }, (_, i) => `f${i}: unknownField`).join(' ')} }`
		const errors = expectSameErrors(query)
		expect(errors).toHaveLength(101)
		expect(errors[100].message).toBe('Too many validation errors, error limit reached. Validation aborted.')
		expect(expectSameErrors(query, { maxErrors: 3 })).toHaveLength(4)
	})

	it('validates a large document with many shared fragments', () => {
		const fragmentCount = 60
		const fragments = Array.from(
			{ length: fragmentCount },
			(_, i) => `fragment F${i} on Article { id title tags(limit: ${i % 3}) { id name } author { id name } }`,
		)
		const spreads = Array.from({ length: fragmentCount }, (_, i) => `...F${i}`).join(' ')
		const fields = Array.from({ length: 40 }, (_, i) => `l${i}: listArticle(limit: ${i}) { ${spreads} }`).join('\n')
		const errors = expectSameErrors(`{ ${fields} }\n${fragments.join('\n')}`)
		expect(errors.length).toBeGreaterThan(0)
	})
})
