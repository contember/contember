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

const unidirectionalSchema = new SchemaBuilder()
	.entity('Post', entity =>
		entity
			.column('name', column => column.type(Model.ColumnType.String))
			.manyHasMany('categories', relation => relation.target('Category')))
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
			...relationOnlySourceLock(testUuid(2)),
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
			...junctionMutationQueries({
				operation: 'connect',
				owningId: testUuid(2),
				inverseId: testUuid(1),
				where: SQL`"owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?`,
				parameters: [testUuid(2), 'created category', testUuid(1)],
				preAuthorize: false,
			}),
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
			...relationOnlySourceLock(testUuid(2)),
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
			...junctionMutationQueries({
				operation: 'connect',
				owningId: testUuid(2),
				inverseId: testUuid(1),
				where: SQL`"owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?`,
				parameters: [testUuid(2), 'created category', testUuid(1)],
				preAuthorize: false,
			}),
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
			...relationOnlySourceLock(testUuid(2)),
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
			},
			...junctionMutationQueries({
				operation: 'connect',
				owningId: testUuid(2),
				inverseId: testUuid(3),
				where: SQL`"owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?`,
				parameters: [testUuid(2), 'allowed category', testUuid(3)],
				preAuthorized: false,
			}),
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
			...relationOnlySourceLock(testUuid(2)),
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
			},
			...junctionMutationQueries({
				operation: 'disconnect',
				owningId: testUuid(2),
				inverseId: testUuid(3),
				where: SQL`"owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?`,
				parameters: [testUuid(2), 'allowed category', testUuid(3)],
				preAuthorized: false,
			}),
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
			...relationOnlySourceLock(testUuid(2)),
			{
				sql: SQL`select "root_"."id" as "id"
					from "public"."category" as "root_"
					inner join "public"."post_categories" as "junction_" on "junction_"."category_id" = "root_"."id"
					where "junction_"."post_id" = ? and "root_"."id" = ?
					for update`,
				parameters: [testUuid(2), testUuid(3)],
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

test('M:N update delete rejects a target outside the enclosing relation', async () => {
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
		executes: failedTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			...relationOnlySourceLock(testUuid(2)),
			{
				sql: SQL`select "root_"."id" as "id"
					from "public"."category" as "root_"
					inner join "public"."post_categories" as "junction_" on "junction_"."category_id" = "root_"."id"
					where "junction_"."post_id" = ? and "root_"."id" = ?
					for update`,
				parameters: [testUuid(2), testUuid(3)],
				response: { rows: [] },
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

test('M:N connect rolls back when the resulting junction state invalidates the source predicate', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {
					update_categories: { not: { categories: { id: 'forbidden_category' } } },
				},
				operations: {
					read: { id: true },
					update: { id: true, categories: 'update_categories' },
				},
			},
			Category: {
				predicates: {},
				operations: {
					read: { id: true },
					update: { id: true, posts: true },
				},
			},
		},
		variables: {
			forbidden_category: { eq: testUuid(3) },
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
				sql: SQL`select true as "authorized"
					from "public"."post" as "root_"
					where "root_"."id" = ? and not(exists (select 1
						from "public"."post_categories" as "root_categories_junction_"
						where "root_"."id" = "root_categories_junction_"."post_id"
							and "root_categories_junction_"."category_id" = ?))
					for update of "root_"`,
				parameters: [testUuid(2), testUuid(3)],
				response: { rows: [{ authorized: true }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
			},
			...junctionMutationQueries({
				operation: 'connect',
				owningId: testUuid(2),
				inverseId: testUuid(3),
				where: SQL`not(exists (select 1
					from "public"."post_categories" as "owningcategories_junction_"
					where "owning"."id" = "owningcategories_junction_"."post_id"
						and "owningcategories_junction_"."category_id" = ?))
					and "owning"."id" = ? and "inverse"."id" = ?`,
				parameters: [testUuid(3), testUuid(2), testUuid(3)],
				postAuthorized: false,
			}),
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

test('M:N disconnect rolls back when the resulting junction state removes the source predicate witness', async () => {
	await execute({
		schema,
		permissions: {
			Post: {
				predicates: {
					update_categories: { categories: { id: 'required_category' } },
				},
				operations: {
					read: { id: true },
					update: { id: true, categories: 'update_categories' },
				},
			},
			Category: {
				predicates: {},
				operations: {
					read: { id: true },
					update: { id: true, posts: true },
				},
			},
		},
		variables: {
			required_category: { eq: testUuid(3) },
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
				sql: SQL`select true as "authorized"
					from "public"."post" as "root_"
					where "root_"."id" = ? and exists (select 1
						from "public"."post_categories" as "root_categories_junction_"
						where "root_"."id" = "root_categories_junction_"."post_id"
							and "root_categories_junction_"."category_id" = ?)
					for update of "root_"`,
				parameters: [testUuid(2), testUuid(3)],
				response: { rows: [{ authorized: true }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
			},
			...junctionMutationQueries({
				operation: 'disconnect',
				owningId: testUuid(2),
				inverseId: testUuid(3),
				where: SQL`exists (select 1
					from "public"."post_categories" as "owningcategories_junction_"
					where "owning"."id" = "owningcategories_junction_"."post_id"
						and "owningcategories_junction_"."category_id" = ?)
					and "owning"."id" = ? and "inverse"."id" = ?`,
				parameters: [testUuid(3), testUuid(2), testUuid(3)],
				postAuthorized: false,
			}),
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

test('M:N connect rolls back when the resulting junction state invalidates the inverse endpoint predicate', async () => {
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
					update_posts: { not: { posts: { id: 'forbidden_post' } } },
				},
				operations: {
					read: { id: true },
					update: { id: true, posts: 'update_posts' },
				},
			},
		},
		variables: {
			forbidden_post: { eq: testUuid(2) },
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
			...relationOnlySourceLock(testUuid(2)),
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
			},
			...junctionMutationQueries({
				operation: 'connect',
				owningId: testUuid(2),
				inverseId: testUuid(3),
				where: SQL`"owning"."id" = ? and not(exists (select 1
					from "public"."post_categories" as "inverseposts_junction_"
					where "inverse"."id" = "inverseposts_junction_"."category_id"
						and "inverseposts_junction_"."post_id" = ?))
					and "inverse"."id" = ?`,
				parameters: [testUuid(2), testUuid(2), testUuid(3)],
				postAuthorized: false,
			}),
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

test('unidirectional M:N validates the resulting source state without a target relation permission', async () => {
	await execute({
		schema: unidirectionalSchema,
		permissions: {
			Post: {
				predicates: {
					update_categories: { name: 'allowed_post' },
				},
				operations: {
					read: { id: true },
					update: { id: true, categories: 'update_categories' },
				},
			},
			Category: {
				predicates: {},
				operations: {
					read: { id: true },
				},
			},
		},
		variables: {
			allowed_post: { eq: 'allowed post' },
		},
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(2)}"}, data: {categories: [{connect: {id: "${testUuid(3)}"}}]}) {
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
				sql: SQL`select true as "authorized"
					from "public"."post" as "root_"
					where "root_"."id" = ? and "root_"."name" = ?
					for update of "root_"`,
				parameters: [testUuid(2), 'allowed post'],
				response: { rows: [{ authorized: true }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
			},
			...junctionMutationQueries({
				operation: 'connect',
				owningId: testUuid(2),
				inverseId: testUuid(3),
				where: SQL`"owning"."name" = ? and "owning"."id" = ? and "inverse"."id" = ?`,
				parameters: ['allowed post', testUuid(2), testUuid(3)],
			}),
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

const junctionMutationQueries = ({
	operation,
	owningId,
	inverseId,
	where,
	parameters,
	preAuthorize = true,
	preAuthorized = true,
	postAuthorized = true,
}: {
	operation: 'connect' | 'disconnect'
	owningId: string
	inverseId: string
	where: string
	parameters: string[]
	preAuthorize?: boolean
	preAuthorized?: boolean
	postAuthorized?: boolean
}) => {
	const authorizationQuery = (authorized: boolean) => ({
		sql: SQL`select true as "authorized"
			from "public"."post" as "owning"
				inner join "public"."category" as "inverse" on true
			where ${where}`,
		parameters,
		response: { rows: authorized ? [{ authorized: true }] : [] },
	})
	const locks = [
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
	]
	const preAuthorization = preAuthorize ? [authorizationQuery(preAuthorized)] : []
	if (!preAuthorized) {
		return [...locks, ...preAuthorization]
	}
	const modification = operation === 'connect'
		? {
			sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
				values (?, ?)
				on conflict do nothing`,
			parameters: [owningId, inverseId],
			response: { rowCount: 1 },
		}
		: {
			sql: SQL`delete from "public"."post_categories"
				where "post_id" = ? and "category_id" = ?`,
			parameters: [owningId, inverseId],
			response: { rowCount: 1 },
		}
	return [...locks, ...preAuthorization, modification, authorizationQuery(postAuthorized)]
}

const relationOnlySourceLock = (id: string) => [{
	sql: SQL`select true as "authorized"
		from "public"."post" as "root_"
		where "root_"."id" = ?
		for update of "root_"`,
	parameters: [id],
	response: { rows: [{ authorized: true }] },
}]
