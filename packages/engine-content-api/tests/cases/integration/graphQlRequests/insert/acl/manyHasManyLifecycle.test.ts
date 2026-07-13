import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

const schema = new SchemaBuilder()
	.entity('Post', entity =>
		entity
			.column('name', column => column.type(Model.ColumnType.String))
			.manyHasMany('categories', relation => relation.target('Category').inversedBy('posts')))
	.entity('Category', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
	.buildSchema()

test('M:N create connectOrCreate existing branch uses the target update predicate', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {},
				operations: {
					create: { id: true, name: true, categories: true },
				},
			},
			Category: {
				predicates: {
					create_posts: { name: 'create_name' },
					update_posts: { name: 'update_name' },
				},
				operations: {
					read: { id: true },
					create: { id: true, name: 'create_posts', posts: 'create_posts' },
					update: { id: true, posts: 'update_posts' },
				},
			},
		},
		variables: {
			create_name: { eq: 'created category' },
			update_name: { eq: 'connected category' },
		},
		query: GQL`mutation {
			createPost(data: {name: "Post", categories: [{connectOrCreate: {
				connect: {id: "${testUuid(2)}"},
				create: {name: "created category"}
			}}]}) {
				ok
			}
		}`,
		executes: sqlTransaction([
			{
				sql: SQL`with "root_" as
					(select ? :: uuid as "id", ? :: text as "name")
					insert into "public"."post" ("id", "name")
					select "root_"."id", "root_"."name"
					from "root_"
					returning "id"`,
				parameters: [testUuid(1), 'Post'],
				response: { rows: [{ id: testUuid(1) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`with "data" as
					(select
						"owning"."id" as "post_id",
						"inverse"."id" as "category_id",
						true as "selected"
					from (values (null)) as "t" inner join "public"."post" as "owning" on true
						inner join "public"."category" as "inverse" on true
					where "owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?),
					"insert" as
					(insert into "public"."post_categories" ("post_id", "category_id")
						select "data"."post_id", "data"."category_id"
						from "data"
						on conflict do nothing
						returning true as inserted)
					select
						coalesce(data.selected, false) as "selected",
						coalesce(insert.inserted, false) as "inserted"
					from (values (null)) as "t" left join "data" as "data" on true
						left join "insert" as "insert" on true`,
				parameters: [testUuid(1), 'connected category', testUuid(2)],
				response: { rows: [{ selected: true, inserted: true }] },
			},
		]),
		return: {
			data: {
				createPost: {
					ok: true,
				},
			},
		},
	})
})

test('M:N inverse create connect uses the target update predicate', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {
					update_categories: { name: 'post_name' },
				},
				operations: {
					read: { id: true },
					update: { id: true, categories: 'update_categories' },
				},
			},
			Category: {
				predicates: {},
				operations: {
					create: { id: true, name: true, posts: true },
				},
			},
		},
		variables: {
			post_name: { eq: 'connected post' },
		},
		query: GQL`mutation {
			createCategory(data: {name: "Category", posts: [{connect: {id: "${testUuid(2)}"}}]}) {
				ok
			}
		}`,
		executes: sqlTransaction([
			{
				sql: SQL`with "root_" as
					(select ? :: uuid as "id", ? :: text as "name")
					insert into "public"."category" ("id", "name")
					select "root_"."id", "root_"."name"
					from "root_"
					returning "id"`,
				parameters: [testUuid(1), 'Category'],
				response: { rows: [{ id: testUuid(1) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`with "data" as
					(select
						"owning"."id" as "post_id",
						"inverse"."id" as "category_id",
						true as "selected"
					from (values (null)) as "t" inner join "public"."post" as "owning" on true
						inner join "public"."category" as "inverse" on true
					where "owning"."name" = ? and "owning"."id" = ? and "inverse"."id" = ?),
					"insert" as
					(insert into "public"."post_categories" ("post_id", "category_id")
						select "data"."post_id", "data"."category_id"
						from "data"
						on conflict do nothing
						returning true as inserted)
					select
						coalesce(data.selected, false) as "selected",
						coalesce(insert.inserted, false) as "inserted"
					from (values (null)) as "t" left join "data" as "data" on true
						left join "insert" as "insert" on true`,
				parameters: ['connected post', testUuid(2), testUuid(1)],
				response: { rows: [{ selected: true, inserted: true }] },
			},
		]),
		return: {
			data: {
				createCategory: {
					ok: true,
				},
			},
		},
	})
})

test('M:N create create uses the target create predicate', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {},
				operations: {
					create: { id: true, name: true, categories: true },
				},
			},
			Category: {
				predicates: {
					create_posts: { name: 'create_name' },
				},
				operations: {
					create: { id: true, name: true, posts: 'create_posts' },
				},
			},
		},
		variables: {
			create_name: { eq: 'created category' },
		},
		query: GQL`mutation {
			createPost(data: {name: "Post", categories: [{create: {name: "created category"}}]}) {
				ok
			}
		}`,
		executes: sqlTransaction([
			{
				sql: SQL`with "root_" as
					(select ? :: uuid as "id", ? :: text as "name")
					insert into "public"."post" ("id", "name")
					select "root_"."id", "root_"."name"
					from "root_"
					returning "id"`,
				parameters: [testUuid(1), 'Post'],
				response: { rows: [{ id: testUuid(1) }] },
			},
			{
				sql: SQL`with "root_" as
					(select ? :: uuid as "id", ? :: text as "name")
					insert into "public"."category" ("id", "name")
					select "root_"."id", "root_"."name"
					from "root_"
					returning "id"`,
				parameters: [testUuid(2), 'created category'],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`with "data" as
					(select
						"owning"."id" as "post_id",
						"inverse"."id" as "category_id",
						true as "selected"
					from (values (null)) as "t" inner join "public"."post" as "owning" on true
						inner join "public"."category" as "inverse" on true
					where "owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?),
					"insert" as
					(insert into "public"."post_categories" ("post_id", "category_id")
						select "data"."post_id", "data"."category_id"
						from "data"
						on conflict do nothing
						returning true as inserted)
					select
						coalesce(data.selected, false) as "selected",
						coalesce(insert.inserted, false) as "inserted"
					from (values (null)) as "t" left join "data" as "data" on true
						left join "insert" as "insert" on true`,
				parameters: [testUuid(1), 'created category', testUuid(2)],
				response: { rows: [{ selected: true, inserted: true }] },
			},
		]),
		return: {
			data: {
				createPost: {
					ok: true,
				},
			},
		},
	})
})

test('M:N create create rolls back the new target and junction when the target create predicate denies', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {},
				operations: {
					create: { id: true, name: true, categories: true },
				},
			},
			Category: {
				predicates: {
					create_posts: { name: 'create_name' },
				},
				operations: {
					create: { id: true, name: true, posts: 'create_posts' },
				},
			},
		},
		variables: {
			create_name: { eq: 'allowed category' },
		},
		query: GQL`mutation {
			createPost(data: {name: "Post", categories: [{create: {name: "denied category"}}]}) {
				ok
			}
		}`,
		executes: failedTransaction([
			{
				sql: SQL`with "root_" as
					(select ? :: uuid as "id", ? :: text as "name")
					insert into "public"."post" ("id", "name")
					select "root_"."id", "root_"."name"
					from "root_"
					returning "id"`,
				parameters: [testUuid(1), 'Post'],
				response: { rows: [{ id: testUuid(1) }] },
			},
			{
				sql: SQL`with "root_" as
					(select ? :: uuid as "id", ? :: text as "name")
					insert into "public"."category" ("id", "name")
					select "root_"."id", "root_"."name"
					from "root_"
					returning "id"`,
				parameters: [testUuid(2), 'denied category'],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`with "data" as
					(select
						"owning"."id" as "post_id",
						"inverse"."id" as "category_id",
						true as "selected"
					from (values (null)) as "t" inner join "public"."post" as "owning" on true
						inner join "public"."category" as "inverse" on true
					where "owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?),
					"insert" as
					(insert into "public"."post_categories" ("post_id", "category_id")
						select "data"."post_id", "data"."category_id"
						from "data"
						on conflict do nothing
						returning true as inserted)
					select
						coalesce(data.selected, false) as "selected",
						coalesce(insert.inserted, false) as "inserted"
					from (values (null)) as "t" left join "data" as "data" on true
						left join "insert" as "insert" on true`,
				parameters: [testUuid(1), 'allowed category', testUuid(2)],
				response: { rows: [{ selected: false, inserted: false }] },
			},
		]),
		return: {
			data: {
				createPost: {
					ok: false,
				},
			},
		},
	})
})
