import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

const schema = new SchemaBuilder().entity('Author', e => e.column('username')).buildSchema()

const permissions: Acl.Permissions = {
	Author: {
		predicates: {
			authorPredicate: {
				username: { eq: 'johndoe' },
			},
			authorPredicate2: {
				username: { isNull: false },
			},
		},
		operations: {
			read: {
				id: 'authorPredicate2',
				username: 'authorPredicate',
			},
		},
	},
}

test('order by a cell-level field guards the order key with the field read predicate', async () => {
	await execute({
		schema: schema,
		permissions: permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor(orderBy: [{username: asc}]) {
            id
            username
          }
        }`,
		executes: [
			{
				sql: SQL`
					select
					    "root_"."id" as "root_id",
					    "root_"."username" = ? as "root___predicate_authorPredicate",
					    "root_"."username" as "root_username"
					from "public"."author" as "root_"
					where not("root_"."username" is null)
					order by case when "root_"."username" = ? then "root_"."username" end asc, "root_"."id" asc
				`,
				parameters: ['johndoe', 'johndoe'],
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root___predicate_authorPredicate: true,
							root_username: 'johndoe',
						},
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{
						id: testUuid(1),
						username: 'johndoe',
					},
				],
			},
		},
	})
})

const relationSchema = new SchemaBuilder()
	.entity('Post', e =>
		e.manyHasOne('author', r =>
			r.target('Author', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.column('isActive', c => c.type(Model.ColumnType.Bool)))))
	.buildSchema()

const relationPermissions: Acl.Permissions = {
	Post: {
		predicates: {},
		operations: {
			read: {
				id: true,
				author: true,
			},
		},
	},
	Author: {
		predicates: {
			authorVisible: {
				isActive: { eq: true },
			},
		},
		operations: {
			read: {
				id: 'authorVisible',
				name: 'authorVisible',
			},
		},
	},
}

test('order by a relation target column guards the order key with the target read predicate', async () => {
	await execute({
		schema: relationSchema,
		permissions: relationPermissions,
		variables: {},
		query: GQL`
        query {
          listPost(orderBy: [{author: {name: asc}}]) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."post" as "root_"
					left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id"
					order by case when "root_author"."is_active" = ? then "root_author"."name" end asc, "root_"."id" asc
				`,
				parameters: [true],
				response: {
					rows: [{ root_id: testUuid(1) }],
				},
			},
		],
		return: {
			data: {
				listPost: [{ id: testUuid(1) }],
			},
		},
	})
})

const hasManySchema = new SchemaBuilder()
	.entity('Author', e =>
		e.oneHasMany('posts', r =>
			r
				.target('Post', e =>
					e
						.column('title', c => c.type(Model.ColumnType.String))
						.column('isPublished', c => c.type(Model.ColumnType.Bool)))
				.ownedBy('author')))
	.buildSchema()

const hasManyPermissions: Acl.Permissions = {
	Author: {
		predicates: {},
		operations: {
			read: {
				id: true,
				posts: true,
			},
		},
	},
	Post: {
		predicates: {
			titleReadable: {
				isPublished: { eq: true },
			},
		},
		operations: {
			read: {
				id: true,
				title: 'titleReadable',
				author: true,
			},
		},
	},
}

test('order by a cell-level field guards the order key in the window-function (limit) path too', async () => {
	await execute({
		schema: hasManySchema,
		permissions: hasManyPermissions,
		variables: {},
		query: GQL`
        query {
          listAuthor {
            id
            posts(orderBy: [{title: asc}], limit: 1) {
              id
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."author" as "root_"`,
				parameters: [],
				response: {
					rows: [{ root_id: testUuid(1) }],
				},
			},
			{
				sql: SQL`with "data" as
					(select
						"root_"."author_id" as "__grouping_key",
						"root_"."id" as "root_id",
						row_number() over(partition by "root_"."author_id"
							order by case when "root_"."is_published" = ? then "root_"."title" end asc, "root_"."id" asc) as "rowNumber_"
					from "public"."post" as "root_"
					where "root_"."author_id" in (?)
					order by case when "root_"."is_published" = ? then "root_"."title" end asc, "root_"."id" asc)
					select "data".* from "data" where "data"."rowNumber_" <= ?`,
				parameters: [true, testUuid(1), true, 1],
				response: {
					rows: [{ __grouping_key: testUuid(1), root_id: testUuid(10) }],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{
						id: testUuid(1),
						posts: [{ id: testUuid(10) }],
					},
				],
			},
		},
	})
})
