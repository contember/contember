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

test('M:N update connectOrCreate new branch uses the target create predicate', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {},
				operations: {
					read: { id: true },
					update: { id: true, categories: true },
				},
			},
			Category: {
				predicates: {
					create_posts: { name: 'create_name' },
					update_posts: { name: 'update_name' },
				},
				operations: {
					read: { id: true },
					create: { id: true, name: true, posts: 'create_posts' },
					update: { id: true, posts: 'update_posts' },
				},
			},
		},
		variables: {
			create_name: { eq: 'created category' },
			update_name: { eq: 'existing category' },
		},
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(2)}"}, data: {categories: [{connectOrCreate: {
				connect: {id: "${testUuid(3)}"},
				create: {name: "created category"}
			}}]}) {
				ok
			}
		}`,
		executes: sqlTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [] },
			},
			{
				sql: SQL`with "root_" as
					(select ? :: uuid as "id", ? :: text as "name")
					insert into "public"."category" ("id", "name")
					select "root_"."id", "root_"."name"
					from "root_"
					returning "id"`,
				parameters: [testUuid(1), 'created category'],
				response: { rows: [{ id: testUuid(1) }] },
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
				parameters: [testUuid(2), 'created category', testUuid(1)],
				response: { rows: [{ selected: true, inserted: true }] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: true,
				},
			},
		},
	})
})

test('M:N update upsert new branch uses the target create predicate', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {},
				operations: {
					read: { id: true },
					update: { id: true, categories: true },
				},
			},
			Category: {
				predicates: {
					create_posts: { name: 'create_name' },
					update_posts: { name: 'update_name' },
				},
				operations: {
					read: { id: true },
					create: { id: true, name: true, posts: 'create_posts' },
					update: { id: true, name: true, posts: 'update_posts' },
				},
			},
		},
		variables: {
			create_name: { eq: 'created category' },
			update_name: { eq: 'existing category' },
		},
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(2)}"}, data: {categories: [{upsert: {
				by: {id: "${testUuid(3)}"},
				update: {name: "existing category"},
				create: {name: "created category"}
			}}]}) {
				ok
			}
		}`,
		executes: sqlTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [] },
			},
			{
				sql: SQL`with "root_" as
					(select ? :: uuid as "id", ? :: text as "name")
					insert into "public"."category" ("id", "name")
					select "root_"."id", "root_"."name"
					from "root_"
					returning "id"`,
				parameters: [testUuid(1), 'created category'],
				response: { rows: [{ id: testUuid(1) }] },
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
				parameters: [testUuid(2), 'created category', testUuid(1)],
				response: { rows: [{ selected: true, inserted: true }] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: true,
				},
			},
		},
	})
})

test('M:N update connect rolls back without changing the junction when the target update predicate denies', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {},
				operations: {
					read: { id: true },
					update: { id: true, categories: true },
				},
			},
			Category: {
				predicates: {
					update_posts: { name: 'update_name' },
				},
				operations: {
					read: { id: true },
					update: { id: true, posts: 'update_posts' },
				},
			},
		},
		variables: {
			update_name: { eq: 'allowed category' },
		},
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(2)}"}, data: {categories: [{connect: {id: "${testUuid(3)}"}}]}) {
				ok
			}
		}`,
		executes: failedTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
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
				parameters: [testUuid(2), 'allowed category', testUuid(3)],
				response: { rows: [{ selected: false, inserted: false }] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: false,
				},
			},
		},
	})
})

test('M:N update disconnect rolls back without changing the junction when the target update predicate denies', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {},
				operations: {
					read: { id: true },
					update: { id: true, categories: true },
				},
			},
			Category: {
				predicates: {
					update_posts: { name: 'update_name' },
				},
				operations: {
					read: { id: true },
					update: { id: true, posts: 'update_posts' },
				},
			},
		},
		variables: {
			update_name: { eq: 'allowed category' },
		},
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(2)}"}, data: {categories: [{disconnect: {id: "${testUuid(3)}"}}]}) {
				ok
			}
		}`,
		executes: failedTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
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
					"delete" as
					(delete from "public"."post_categories"
						using "data" as "data"
						where "post_categories"."post_id" = "data"."post_id" and "post_categories"."category_id" = "data"."category_id"
						returning true as deleted)
					select
						coalesce(data.selected, false) as "selected",
						coalesce(delete.deleted, false) as "deleted"
					from (values (null)) as "t" left join "data" as "data" on true
						left join "delete" as "delete" on true`,
				parameters: [testUuid(2), 'allowed category', testUuid(3)],
				response: { rows: [{ selected: false, deleted: false }] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: false,
				},
			},
		},
	})
})

test('M:N update delete remains available through the target delete lifecycle without target relation updates', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {},
				operations: {
					read: { id: true },
					update: { id: true, categories: true },
				},
			},
			Category: {
				predicates: {},
				operations: {
					read: { id: true },
					delete: true,
				},
			},
		},
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(2)}"}, data: {categories: [{delete: {id: "${testUuid(3)}"}}]}) {
				ok
			}
		}`,
		executes: sqlTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
			},
			{
				sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3), allowed: true }] },
			},
			{
				sql: SQL`delete from "public"."category" where "id" in (?)`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: true,
				},
			},
		},
	})
})
