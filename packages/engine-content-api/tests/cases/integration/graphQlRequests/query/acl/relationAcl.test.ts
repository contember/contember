import { c, createSchema } from '@contember/schema-definition'
import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { PermissionFactory } from '../../../../../../src'
import { testUuid } from '@contember/engine-api-tester'


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
				sql: SQL`select "root_"."title" as "root_title", "root_"."disclose_author" = ? as "root___predicate_discloseAuthor_eq_true", "root_"."author_id" as "root_author", "root_"."id" as "root_id" 
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
				sql: SQL`select "root_"."id" as "root_id", "root_"."name" as "root_name", "root_"."id" as "root_id" from "public"."author" as "root_" where "root_"."id" in (?)`,
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
				sql: SQL`select "root_"."title" as "root_title", "root_"."disclose_author" = ? as "root___predicate_discloseauthor_eq_true", "root_"."id" as "root_id", "root_"."id" as "root_id" 
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
				sql: SQL`select "junction_"."author_id", "junction_"."article_id" from "public"."article_authors" as "junction_" where "junction_"."article_id" in (?)`,
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


