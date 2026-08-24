import { c, createSchema } from '@contember/schema-definition'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { PermissionFactory } from '../../../../../../src/index.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * A single role on purpose: for one role the root and nested sets used to be identical, so a
 * through-only grant leaked into the root set. Two roles would hide that.
 */
namespace ThroughRead {
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

test('reads a through-only field over a relation', async () => {
	const schema = createSchema(ThroughRead)
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
            author {
              name
              secret
            }
          }
        }`,
		executes: [
			{
				sql:
					SQL`select "root_"."title" as "root_title", "root_"."author_id" as "root_author", "root_"."id" as "root_id" from "public"."article" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(1), root_title: 'Article A', root_author: testUuid(10) },
					],
				},
			},
			{
				sql:
					SQL`select "root_"."id" as "root_id", "root_"."name" as "root_name", "root_"."disclosed" = ? as "root___predicate_disclosed_eq_true", "root_"."secret" as "root_secret", "root_"."id" as "root_id" 
from "public"."author" as "root_" where "root_"."id" in (?)`,
				parameters: [true, testUuid(10)],
				response: {
					rows: [
						{
							root_id: testUuid(10),
							root_name: 'John Doe',
							root_secret: 'shh',
							root___predicate_disclosed_eq_true: true,
						},
					],
				},
			},
		],
		return: {
			data: {
				listArticle: [
					{
						title: 'Article A',
						author: { name: 'John Doe', secret: 'shh' },
					},
				],
			},
		},
	})
})

test('through-only field is not readable at the root', async () => {
	const schema = createSchema(ThroughRead)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listAuthor {
            name
            secret
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id" from "public"."author" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(10), root_name: 'John Doe' },
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{ name: 'John Doe', secret: null },
				],
			},
		},
	})
})

namespace ThroughOnlyEntity {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, {
		read: ['title', 'image'],
	})
	export class Article {
		title = c.stringColumn().notNull()
		image = c.manyHasOne(Image).notNull()
	}

	@c.Allow(editorRole, {
		through: true,
		read: ['url'],
	})
	export class Image {
		url = c.stringColumn().notNull()
	}
}

test('entity with only through grants has no root queries', async () => {
	const schema = createSchema(ThroughOnlyEntity)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listImage { url }
          getImage(by: { id: "00000000-0000-0000-0000-000000000001" }) { url }
          paginateImage { pageInfo { totalCount } }
        }`,
		executes: [],
		return: {
			errors: [
				{ message: 'Cannot query field "listImage" on type "Query".' },
				{ message: 'Cannot query field "getImage" on type "Query".' },
				{ message: 'Cannot query field "paginateImage" on type "Query". Did you mean "paginateArticle"?' },
			],
		},
	})
})

test('the same entity is readable over a relation', async () => {
	const schema = createSchema(ThroughOnlyEntity)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listArticle {
            image {
              url
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."image_id" as "root_image", "root_"."id" as "root_id" from "public"."article" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(1), root_image: testUuid(20) },
					],
				},
			},
			{
				sql:
					SQL`select "root_"."id" as "root_id", "root_"."url" as "root_url", "root_"."id" as "root_id" from "public"."image" as "root_" where "root_"."id" in (?)`,
				parameters: [testUuid(20)],
				response: {
					rows: [
						{ root_id: testUuid(20), root_url: 'https://example.com/a.png' },
					],
				},
			},
		],
		return: {
			data: {
				listArticle: [
					{ image: { url: 'https://example.com/a.png' } },
				],
			},
		},
	})
})

/**
 * Neither grant is unconditional, so the primary-key predicate really is the union of the field
 * predicates in its own scope: `published` at the root, `published or disclosed` under a relation.
 */
namespace RowLevelUnion {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, {
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
		published = c.boolColumn().notNull()
		disclosed = c.boolColumn().notNull()
	}
}

test('row-level predicate over a relation is the union of the root and through field predicates', async () => {
	const schema = createSchema(RowLevelUnion)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listArticle {
            author {
              secret
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."author_id" as "root_author", "root_"."id" as "root_id" from "public"."article" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(1), root_author: testUuid(10) },
					],
				},
			},
			{
				sql:
					SQL`select "root_"."id" as "root_id", "root_"."disclosed" = ? as "root___predicate_disclosed_eq_true", "root_"."secret" as "root_secret", "root_"."id" as "root_id" 
from "public"."author" as "root_" where "root_"."id" in (?) and ("root_"."published" = ? or "root_"."disclosed" = ?)`,
				parameters: [true, testUuid(10), true, true],
				response: {
					rows: [
						{
							root_id: testUuid(10),
							root_secret: 'shh',
							root___predicate_disclosed_eq_true: true,
						},
					],
				},
			},
		],
		return: {
			data: {
				listArticle: [
					{ author: { secret: 'shh' } },
				],
			},
		},
	})
})

test('row-level predicate at the root is the union of the root field predicates only', async () => {
	const schema = createSchema(RowLevelUnion)
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: root,
		nestedPermissions: all,
		variables: {},
		query: GQL`
        query {
          listAuthor {
            name
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id" from "public"."author" as "root_" where "root_"."published" = ?`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(10), root_name: 'John Doe' },
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{ name: 'John Doe' },
				],
			},
		},
	})
})
