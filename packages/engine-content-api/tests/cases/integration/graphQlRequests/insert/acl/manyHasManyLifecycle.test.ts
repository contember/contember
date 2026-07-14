import { expect, test } from 'bun:test'
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
			...junctionConnectQueries(testUuid(1), testUuid(2), {
				where: SQL`"owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?`,
				parameters: [testUuid(1), 'connected category', testUuid(2)],
			}),
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
			...junctionConnectQueries(testUuid(2), testUuid(1), {
				where: SQL`"owning"."name" = ? and "owning"."id" = ? and "inverse"."id" = ?`,
				parameters: ['connected post', testUuid(2), testUuid(1)],
			}),
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
	const events: string[] = []
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
					create_posts: { posts: { id: 'created_post' } },
				},
				operations: {
					create: { id: true, name: true, posts: 'create_posts' },
				},
			},
		},
		variables: {
			created_post: { eq: testUuid(1) },
		},
		setupMapper: mapper => {
			mapper.eventManager.listen('BeforeJunctionUpdateEvent', async () => {
				events.push('before junction')
			})
			mapper.eventManager.listen('AfterJunctionUpdateEvent', async () => {
				events.push('after junction')
			})
			mapper.eventManager.listen('BeforeCommitEvent', async () => {
				events.push('before commit')
			})
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
			...junctionConnectQueries(testUuid(1), testUuid(2), {
				where: SQL`"owning"."id" = ? and exists (select 1
					from "public"."post_categories" as "inverseposts_junction_"
					where "inverse"."id" = "inverseposts_junction_"."category_id"
						and "inverseposts_junction_"."post_id" = ?) and "inverse"."id" = ?`,
				parameters: [testUuid(1), testUuid(1), testUuid(2)],
				preAuthorize: false,
			}),
		]),
		return: {
			data: {
				createPost: {
					ok: true,
				},
			},
		},
	})
	expect(events).toEqual(['before junction', 'after junction', 'before commit'])
})

test('M:N create create rolls back the new target and junction when the target create predicate denies', async () => {
	const events: string[] = []
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
					create_posts: { posts: { id: 'created_post' } },
				},
				operations: {
					create: { id: true, name: true, posts: 'create_posts' },
				},
			},
		},
		variables: {
			created_post: { eq: testUuid(3) },
		},
		setupMapper: mapper => {
			mapper.eventManager.listen('BeforeJunctionUpdateEvent', async () => {
				events.push('before junction')
			})
			mapper.eventManager.listen('AfterJunctionUpdateEvent', async () => {
				events.push('after junction')
			})
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
			...junctionConnectQueries(testUuid(1), testUuid(2), {
				where: SQL`"owning"."id" = ? and exists (select 1
					from "public"."post_categories" as "inverseposts_junction_"
					where "inverse"."id" = "inverseposts_junction_"."category_id"
						and "inverseposts_junction_"."post_id" = ?) and "inverse"."id" = ?`,
				parameters: [testUuid(1), testUuid(3), testUuid(2)],
				preAuthorize: false,
				postAuthorized: false,
			}),
		]),
		return: {
			data: {
				createPost: {
					ok: false,
				},
			},
		},
	})
	expect(events).toEqual([])
})

const junctionConnectQueries = (
	owningId: string,
	inverseId: string,
	authorization: {
		where: string
		parameters: string[]
		preAuthorize?: boolean
		postAuthorized?: boolean
	},
) => {
	const authorizationQuery = {
		sql: SQL`select true as "authorized"
			from "public"."post" as "owning"
				inner join "public"."category" as "inverse" on true
			where ${authorization.where}`,
		parameters: authorization.parameters,
		response: { rows: authorization.postAuthorized === false ? [] : [{ authorized: true }] },
	}
	return [
		{
			sql: SQL`select "root_"."id" as "primary"
				from "public"."category" as "root_"
				where "root_"."id" in (?)
				order by "root_"."id" asc
				for update of "root_"`,
			parameters: [inverseId],
			response: { rows: [{ primary: inverseId }] },
		},
		{
			sql: SQL`select "root_"."id" as "primary"
				from "public"."post" as "root_"
				where "root_"."id" in (?)
				order by "root_"."id" asc
				for update of "root_"`,
			parameters: [owningId],
			response: { rows: [{ primary: owningId }] },
		},
		...(authorization.preAuthorize === false ? [] : [authorizationQuery]),
		{
			sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
				values (?, ?)
				on conflict do nothing`,
			parameters: [owningId, inverseId],
			response: { rowCount: 1 },
		},
		authorizationQuery,
	]
}
