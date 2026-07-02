import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

const schema = new SchemaBuilder()
	.entity('Post', entityBuilder => entityBuilder.oneHasMany('locales', c => c.target('PostLocale').ownedBy('post')))
	.entity('PostLocale', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
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

test('_meta.readable follows the through (all) permission set through a relation, updatable stays root-only', async () => {
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
								// readable must match the actual (unmasked) value, which uses the through set.
								_meta: { title: { readable: true, updatable: false } },
							},
						],
					},
					{
						locales: [
							{
								id: testUuid(4),
								title: 'bar',
								_meta: { title: { readable: true, updatable: false } },
							},
						],
					},
				],
			},
		},
	})
})
