import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

const schema = new SchemaBuilder()
	.entity('Post', entityBuilder => entityBuilder.oneHasMany('locales', c => c.target('PostLocale').ownedBy('post')))
	.entity('PostLocale', entity =>
		entity
			.column('title', column => column.type(Model.ColumnType.String))
			.column('visible', column => column.type(Model.ColumnType.Bool)))
	.buildSchema()

// Root set: PostLocale.title is NOT readable/updatable at the query root.
const permissions: Acl.Permissions = {
	Post: {
		predicates: {},
		operations: {
			read: {
				id: true,
				locales: true,
			},
			update: {
				id: true,
				locales: true,
			},
		},
	},
	PostLocale: {
		predicates: {},
		operations: {
			read: {
				id: true,
				post: true,
				title: false,
			},
			update: {
				id: true,
				post: true,
				title: false,
			},
		},
	},
}

// Through (all) set: PostLocale.title becomes readable/updatable when reached through a relation.
const allPermissions: Acl.Permissions = {
	Post: {
		predicates: {},
		operations: {
			read: {
				id: true,
				locales: true,
			},
			update: {
				id: true,
				locales: true,
			},
		},
	},
	PostLocale: {
		predicates: {},
		operations: {
			read: {
				id: true,
				post: true,
				title: true,
			},
			update: {
				id: true,
				post: true,
				title: true,
			},
		},
	},
}

test('_meta flags use through permissions through a relation', async () => {
	await execute({
		schema,
		permissions,
		allPermissions,
		query: GQL`
			query {
				listPost {
					locales {
						id
						title
						_meta {
							title {
								readable
								updatable
							}
						}
					}
				}
			}`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."post" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(1) },
						{ root_id: testUuid(2) },
					],
				},
			},
			{
				sql: SQL`
					select "root_"."post_id" as "__grouping_key",
					       "root_"."id" as "root_id",
					       "root_"."title" as "root_title"
					from "public"."post_locale" as "root_" where "root_"."post_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(3), root_title: 'foo' },
						{ __grouping_key: testUuid(2), root_id: testUuid(4), root_title: 'bar' },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						locales: [
							{
								id: testUuid(3),
								title: 'foo',
								_meta: { title: { readable: true, updatable: true } },
							},
						],
					},
					{
						locales: [
							{
								id: testUuid(4),
								title: 'bar',
								_meta: { title: { readable: true, updatable: true } },
							},
						],
					},
				],
			},
		},
	})
})

test('_meta.updatable uses root permissions at the query root', async () => {
	await execute({
		schema,
		permissions,
		allPermissions,
		query: GQL`
			query {
				listPostLocale {
					id
					_meta {
						title {
							updatable
						}
					}
				}
			}`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id" from "public"."post_locale" as "root_"`,
				parameters: [],
				response: {
					rows: [{ root_id: testUuid(3) }],
				},
			},
		],
		return: {
			data: {
				listPostLocale: [{ id: testUuid(3), _meta: { title: { updatable: false } } }],
			},
		},
	})
})

const predicatePermissions: Acl.Permissions = {
	Post: permissions.Post,
	PostLocale: {
		predicates: {},
		operations: {
			read: {
				id: true,
				post: true,
				title: false,
				visible: false,
			},
			update: {
				id: true,
				post: true,
				title: false,
			},
		},
	},
}

const predicateAllPermissions: Acl.Permissions = {
	Post: allPermissions.Post,
	PostLocale: {
		predicates: {
			titleVisible: { visible: { eq: true } },
		},
		operations: {
			read: {
				id: true,
				post: true,
				title: 'titleVisible',
				visible: false,
			},
			update: {
				id: true,
				post: true,
				title: 'titleVisible',
			},
		},
	},
}

test('_meta flags compile through-only cell predicates against the all permission set', async () => {
	await execute({
		schema,
		permissions: predicatePermissions,
		allPermissions: predicateAllPermissions,
		query: GQL`
			query {
				listPost {
					locales {
						id
						_meta {
							title {
								readable
								updatable
							}
						}
					}
				}
			}
		`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."post" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(1) },
						{ root_id: testUuid(2) },
					],
				},
			},
			{
				sql: SQL`
					select "root_"."post_id" as "__grouping_key",
					       "root_"."id" as "root_id",
					       "root_"."visible" = ? as "root___predicate_titleVisible"
					from "public"."post_locale" as "root_" where "root_"."post_id" in (?, ?)
				`,
				parameters: [true, testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(3), root___predicate_titleVisible: true },
						{ __grouping_key: testUuid(2), root_id: testUuid(4), root___predicate_titleVisible: false },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{ locales: [{ id: testUuid(3), _meta: { title: { readable: true, updatable: true } } }] },
					{ locales: [{ id: testUuid(4), _meta: { title: { readable: false, updatable: false } } }] },
				],
			},
		},
	})
})

test('nested updates use the same through update predicate as _meta.updatable', async () => {
	await execute({
		schema,
		permissions: predicatePermissions,
		allPermissions: predicateAllPermissions,
		query: GQL`
			mutation {
				updatePost(
					by: { id: "${testUuid(1)}" }
					data: { locales: [{ update: { by: { id: "${testUuid(3)}" }, data: { title: "Updated" } } }] }
				) {
					ok
				}
			}`,
		executes: sqlTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(1)],
				response: { rows: [{ id: testUuid(1) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
				parameters: [testUuid(3), testUuid(1)],
				response: { rows: [{ id: testUuid(3) }] },
			},
			{
				sql:
					SQL`with "newData_" as (select ? :: text as "title", "root_"."title" as "title_old__", "root_"."post_id", "root_"."id", "root_"."visible"  from "public"."post_locale" as "root_"  where "root_"."id" = ? and "root_"."visible" = ?)
					update  "public"."post_locale" set  "title" =  "newData_"."title"   from "newData_"  where "post_locale"."id" = "newData_"."id" and "newData_"."visible" = ?  returning "title_old__"`,
				parameters: ['Updated', testUuid(3), true, true],
				response: { rows: [{ title_old__: 'Original' }] },
			},
		]),
		return: {
			data: {
				updatePost: { ok: true },
			},
		},
	})
})
