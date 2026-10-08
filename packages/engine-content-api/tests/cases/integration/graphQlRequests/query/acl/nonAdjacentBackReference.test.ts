import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// A to-one hop may skip its target's read guard only when it returns to the IMMEDIATE parent row. In
// Author -> posts -> category -> posts -> author the inner `author` hop is the inverse of the outer
// `Author.posts`, but it starts from a sibling post of the category, so it reaches arbitrary (hidden) authors.

const schema = new SchemaBuilder()
	.entity('Author', e =>
		e
			.column('name')
			.column('isPublic', c => c.type(Model.ColumnType.Bool))
			.oneHasMany('posts', r => r.target('Post').ownedBy('author')))
	.entity('Post', e => e.column('title').manyHasOne('category', r => r.target('Category').inversedBy('posts')))
	.entity('Category', e => e.column('name'))
	.buildSchema()

const permissions: Acl.Permissions = {
	Author: {
		predicates: { pub: { isPublic: { eq: true } } },
		operations: { read: { id: 'pub', name: 'pub', isPublic: 'pub', posts: 'pub' } },
	},
	Post: { predicates: {}, operations: { read: { id: true, title: true, author: true, category: true } } },
	Category: { predicates: {}, operations: { read: { id: true, name: true, posts: true } } },
}

test('filter through a non-adjacent back-reference keeps the target read guard', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor(filter: { posts: { category: { posts: { author: { name: { eq: "x" } } } } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."author" as "root_"
					where exists (select 1
						from "public"."post" as "root_posts"
						left join "public"."category" as "root_posts_category" on "root_posts"."category_id" = "root_posts_category"."id"
						left join "public"."post" as "root_posts_category_posts" on "root_posts_category"."id" = "root_posts_category_posts"."category_id"
						left join (select "root_posts_category_posts_author$".* from "public"."author" as "root_posts_category_posts_author$"
							where "root_posts_category_posts_author$"."is_public" = ?) as "root_posts_category_posts_author$"
							on "root_posts_category_posts"."author_id" = "root_posts_category_posts_author$"."id"
						where "root_"."id" = "root_posts"."author_id" and "root_posts_category_posts_author$"."name" = ?)
					and "root_"."is_public" = ?
				`,
				parameters: [true, 'x', true],
				response: {
					rows: [{ root_id: testUuid(1) }],
				},
			},
		],
		return: {
			data: {
				listAuthor: [{ id: testUuid(1) }],
			},
		},
	})
})

test('filter and order by in a nested relation fetch keep the read guard of a non-adjacent back-reference', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor {
            id
            posts {
              id
              category {
                id
                posts(filter: { author: { name: { eq: "x" } } }, orderBy: [{ author: { name: asc } }]) {
                  id
                }
              }
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."author" as "root_" where "root_"."is_public" = ?`,
				parameters: [true],
				response: {
					rows: [{ root_id: testUuid(1) }],
				},
			},
			{
				sql: SQL`select "root_"."author_id" as "__grouping_key", "root_"."id" as "root_id", "root_"."category_id" as "root_category"
					from "public"."post" as "root_"
					where "root_"."author_id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [{ __grouping_key: testUuid(1), root_id: testUuid(10), root_category: testUuid(20) }],
				},
			},
			{
				sql:
					SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."category" as "root_" where "root_"."id" in (?)`,
				parameters: [testUuid(20)],
				response: {
					rows: [{ root_id: testUuid(20) }],
				},
			},
			{
				// The filter and the order key share one guarded join of the hidden-author-free source.
				sql: SQL`select "root_"."category_id" as "__grouping_key", "root_"."id" as "root_id"
					from "public"."post" as "root_"
					left join (select "root_author$".* from "public"."author" as "root_author$" where "root_author$"."is_public" = ?) as "root_author$"
						on "root_"."author_id" = "root_author$"."id"
					where "root_author$"."name" = ? and "root_"."category_id" in (?)
					order by "root_author$"."name" asc, "root_"."id" asc`,
				parameters: [true, 'x', testUuid(20)],
				response: {
					rows: [{ __grouping_key: testUuid(20), root_id: testUuid(11) }],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{
						id: testUuid(1),
						posts: [{ id: testUuid(10), category: { id: testUuid(20), posts: [{ id: testUuid(11) }] } }],
					},
				],
			},
		},
	})
})
