import { c, createSchema } from '@contember/schema-definition'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { PermissionFactory } from '../../../../../../src/index.js'
import { testUuid } from '../../../../../src/testUuid.js'

namespace RelationAclManyHasOne {
	export const readerRole = c.createRole('reader')

	@c.Allow(readerRole, {
		read: ['title'],
	})
	@c.Allow(readerRole, {
		when: { discloseAuthor: { eq: true } },
		read: ['author'],
	})
	export class Article {
		title = c.stringColumn().notNull()
		author = c.manyHasOne(Author).notNull()
		discloseAuthor = c.boolColumn().notNull()
	}

	@c.Allow(readerRole, {
		read: true,
	})
	export class Author {
		name = c.stringColumn().notNull()
	}
}

test('can read same entity only over relation of some rows - many has one', async () => {
	const schema = createSchema(RelationAclManyHasOne)

	const permissions = new PermissionFactory().create(schema, ['reader'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {},
		query: GQL`
        query {
          listArticle {
          	title
          	author {
				name
          	}
          }
        }`,
		executes: [
			{
				sql:
					SQL`select "root_"."title" as "root_title", "root_"."disclose_author" = ? as "root___predicate_discloseAuthor_eq_true", "root_"."author_id" as "root_author", "root_"."id" as "root_id" 
from "public"."article" as "root_"`,
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root_title: 'Article A',
							root___predicate_discloseAuthor_eq_true: true,
							root_author: testUuid(10),
						},
						{
							root_id: testUuid(2),
							root_title: 'Article B',
							root___predicate_discloseAuthor_eq_true: false,
							root_author: testUuid(10),
						},
					],
				},
			},
			{
				sql:
					SQL`select "root_"."id" as "root_id", "root_"."name" as "root_name", "root_"."id" as "root_id" from "public"."author" as "root_" where "root_"."id" in (?)`,
				parameters: [testUuid(10)],
				response: {
					rows: [
						{
							root_id: testUuid(10),
							root_name: 'John doe',
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
						author: {
							name: 'John doe',
						},
					},
					{
						title: 'Article B',
						author: null,
					},
				],
			},
		},
	})
})

namespace RelationAclManyHasMany {
	export const readerRole = c.createRole('reader')

	@c.Allow(readerRole, {
		read: ['title'],
	})
	@c.Allow(readerRole, {
		when: { discloseAuthor: { eq: true } },
		read: ['authors'],
	})
	export class Article {
		title = c.stringColumn().notNull()
		authors = c.manyHasMany(Author)
		discloseAuthor = c.boolColumn().notNull()
	}

	@c.Allow(readerRole, {
		read: true,
	})
	export class Author {
		name = c.stringColumn().notNull()
	}
}

test('can read same entity only over relation of some rows - many has many', async () => {
	const schema = createSchema(RelationAclManyHasMany)

	const permissions = new PermissionFactory().create(schema, ['reader'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {},
		query: GQL`
        query {
          listArticle {
          	title
          	authors {
				name
          	}
          }
        }`,
		executes: [
			{
				sql:
					SQL`select "root_"."title" as "root_title", "root_"."disclose_author" = ? as "root___predicate_discloseauthor_eq_true", "root_"."id" as "root_id", "root_"."id" as "root_id" 
from "public"."article" as "root_"`,
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root_title: 'Article A',
							root___predicate_discloseAuthor_eq_true: true,
						},
						{
							root_id: testUuid(2),
							root_title: 'Article B',
							root___predicate_discloseAuthor_eq_true: false,
						},
					],
				},
			},
			{
				sql:
					SQL`select "junction_"."author_id", "junction_"."article_id" from "public"."article_authors" as "junction_" where "junction_"."article_id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [
						{
							article_id: testUuid(1),
							author_id: testUuid(10),
						},
						{
							article_id: testUuid(1),
							author_id: testUuid(11),
						},
					],
				},
			},
			{
				sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id" from "public"."author" as "root_" where "root_"."id" in (?, ?)`,
				parameters: [testUuid(10), testUuid(11)],
				response: {
					rows: [
						{
							root_id: testUuid(10),
							root_name: 'John doe',
						},
						{
							root_id: testUuid(11),
							root_name: 'Jack doe',
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
						authors: [
							{
								name: 'John doe',
							},
							{
								name: 'Jack doe',
							},
						],
					},
					{
						title: 'Article B',
						authors: [],
					},
				],
			},
		},
	})
})

namespace RelationAclManyHasManyTargetGuard {
	export const readerRole = c.createRole('reader')

	@c.Allow(readerRole, { read: true })
	export class Post {
		tags = c.manyHasMany(Tag)
	}

	@c.Allow(readerRole, {
		when: { visible: { eq: true } },
		read: true,
	})
	export class Tag {
		name = c.stringColumn().notNull()
		visible = c.boolColumn().notNull()
	}
}

test('many-has-many count and pagination apply a target row guard with an empty user filter', async () => {
	const schema = createSchema(RelationAclManyHasManyTargetGuard)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	await execute({
		schema: schema.model,
		permissions,
		variables: {},
		query: GQL`
			query {
				listPost {
					id
					paginateTags(skip: 1, first: 1) {
						pageInfo {
							totalCount
						}
						edges {
							node {
								name
							}
						}
					}
				}
			}
		`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id"
					from "public"."post" as "root_"`,
				response: { rows: [{ root_id: testUuid(1) }] },
			},
			{
				sql: SQL`select "junction_"."post_id", count(*) as "row_count"
					from "public"."post_tags" as "junction_"
					inner join "public"."tag" as "root_" on "junction_"."tag_id" = "root_"."id"
					where "junction_"."post_id" in (?) and "root_"."visible" = ?
					group by "junction_"."post_id"`,
				parameters: [testUuid(1), true],
				response: { rows: [{ post_id: testUuid(1), row_count: 2 }] },
			},
			{
				sql: SQL`with "data" as
					(select "junction_"."tag_id", "junction_"."post_id",
						row_number() over(partition by "junction_"."post_id" order by "root_"."id" asc) as "rowNumber_"
					from "public"."post_tags" as "junction_"
					inner join "public"."tag" as "root_" on "junction_"."tag_id" = "root_"."id"
					where "junction_"."post_id" in (?) and "root_"."visible" = ?
					order by "root_"."id" asc)
					select "data".* from "data"
					where "data"."rowNumber_" > ? and "data"."rowNumber_" <= ?`,
				parameters: [testUuid(1), true, 1, 2],
				response: { rows: [{ post_id: testUuid(1), tag_id: testUuid(11) }] },
			},
			{
				sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id"
					from "public"."tag" as "root_"
					where "root_"."id" in (?) and "root_"."visible" = ?`,
				parameters: [testUuid(11), true],
				response: { rows: [{ root_id: testUuid(11), root_name: 'visible tag' }] },
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						paginateTags: {
							pageInfo: { totalCount: 2 },
							edges: [{ node: { name: 'visible tag' } }],
						},
					},
				],
			},
		},
	})
})
