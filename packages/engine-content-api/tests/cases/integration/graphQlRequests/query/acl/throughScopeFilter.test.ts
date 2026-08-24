import { c, createSchema } from '@contember/schema-definition'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { PermissionFactory } from '../../../../../../src/index.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * The query starts at `Article`, but `Author` is reached over a relation inside the filter, so it
 * is nested - the scope has to be derived per node, not decided once for the whole query.
 */
namespace FilterTarget {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, {
		read: ['title', 'author'],
	})
	export class Article {
		title = c.stringColumn().notNull()
		author = c.manyHasOne(Author).notNull()
	}

	@c.Allow(editorRole, {
		read: ['name'],
	})
	@c.Allow(editorRole, {
		through: true,
		when: { disclosed: { eq: true } },
		read: ['secret'],
	})
	export class Author {
		name = c.stringColumn().notNull()
		secret = c.stringColumn().notNull()
		disclosed = c.boolColumn().notNull()
	}
}

test('through-only target inside a root filter resolves at nested scope', async () => {
	const schema = createSchema(FilterTarget)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listArticle(filter: { author: { secret: { eq: "shh" } } }) {
            title
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."title" as "root_title", "root_"."id" as "root_id" 
from "public"."article" as "root_" left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id" 
where "root_author"."secret" = ? and "root_author"."disclosed" = ?`,
				parameters: ['shh', true],
				response: {
					rows: [
						{ root_id: testUuid(1), root_title: 'Article A' },
					],
				},
			},
		],
		return: {
			data: {
				listArticle: [
					{ title: 'Article A' },
				],
			},
		},
	})
})

test('through-only target inside a not branch of a root filter resolves at nested scope', async () => {
	const schema = createSchema(FilterTarget)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listArticle(filter: { not: { author: { secret: { eq: "shh" } } } }) {
            title
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."title" as "root_title", "root_"."id" as "root_id" 
from "public"."article" as "root_" left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id" 
where not("root_author"."secret" = ? and "root_author"."disclosed" = ?)`,
				parameters: ['shh', true],
				response: {
					rows: [
						{ root_id: testUuid(1), root_title: 'Article A' },
					],
				},
			},
		],
		return: {
			data: {
				listArticle: [
					{ title: 'Article A' },
				],
			},
		},
	})
})

test('through-only target inside or and and branches of a root filter resolves at nested scope', async () => {
	const schema = createSchema(FilterTarget)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listArticle(filter: {
            or: [
              { author: { secret: { eq: "shh" } } },
              { and: [{ author: { secret: { eq: "psst" } } }, { title: { eq: "Article A" } }] }
            ]
          }) {
            title
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."title" as "root_title", "root_"."id" as "root_id" 
from "public"."article" as "root_" left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id" 
where ("root_author"."secret" = ? and "root_author"."disclosed" = ? or "root_author"."secret" = ? and "root_author"."disclosed" = ? and "root_"."title" = ?)`,
				parameters: ['shh', true, 'psst', true, 'Article A'],
				response: {
					rows: [
						{ root_id: testUuid(1), root_title: 'Article A' },
					],
				},
			},
		],
		return: {
			data: {
				listArticle: [
					{ title: 'Article A' },
				],
			},
		},
	})
})

/**
 * `Article`'s own read predicate traverses into `Author`, so the target of a predicate - not of a
 * user filter - is the nested node here. It filters on `verified`, which no `Author` grant mentions,
 * so the injected target predicate survives the where optimizer instead of being absorbed.
 */
namespace PredicateTarget {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, {
		when: { author: { verified: { eq: true } } },
		read: ['title', 'author'],
	})
	export class Article {
		title = c.stringColumn().notNull()
		author = c.manyHasOne(Author).notNull()
	}

	@c.Allow(editorRole, {
		when: { published: { eq: true } },
		read: ['name'],
	})
	@c.Allow(editorRole, {
		through: true,
		when: { disclosed: { eq: true } },
		read: ['secret'],
	})
	export class Author {
		name = c.stringColumn().notNull()
		secret = c.stringColumn().notNull()
		verified = c.boolColumn().notNull()
		published = c.boolColumn().notNull()
		disclosed = c.boolColumn().notNull()
	}
}

test('relation target inside a predicate resolves at nested scope', async () => {
	const schema = createSchema(PredicateTarget)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listArticle {
            title
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."title" as "root_title", "root_"."id" as "root_id" 
from "public"."article" as "root_" left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id" 
where "root_author"."verified" = ? and ("root_author"."published" = ? or "root_author"."disclosed" = ?)`,
				parameters: [true, true, true],
				response: {
					rows: [
						{ root_id: testUuid(1), root_title: 'Article A' },
					],
				},
			},
		],
		return: {
			data: {
				listArticle: [
					{ title: 'Article A' },
				],
			},
		},
	})
})
