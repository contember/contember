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

const hopSchema = new SchemaBuilder()
	.entity('Post', e =>
		e
			.column('isPublished', c => c.type(Model.ColumnType.Bool))
			.manyHasOne('author', r =>
				r.target('Author', e =>
					e
						.column('name', c => c.type(Model.ColumnType.String))
						.column('isActive', c => c.type(Model.ColumnType.Bool)))))
	.buildSchema()

const hopPermissions: Acl.Permissions = {
	Post: {
		predicates: {
			authorReadable: { isPublished: { eq: true } },
		},
		operations: {
			read: {
				id: true,
				author: 'authorReadable',
			},
		},
	},
	Author: {
		predicates: {},
		operations: {
			read: {
				id: true,
				name: true,
			},
		},
	},
}

test('order by through a relation guards the order key with the relation-field (hop) read predicate', async () => {
	// `Post.author` is cell-masked for unpublished posts, so their order key must not reflect the hidden
	// author's name even though `Author.name` itself is public.
	await execute({
		schema: hopSchema,
		permissions: hopPermissions,
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
					order by case when "root_"."is_published" = ? then "root_author"."name" end asc, "root_"."id" asc
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

const hopAndTargetPermissions: Acl.Permissions = {
	Post: {
		predicates: {
			authorReadable: { isPublished: { eq: true } },
		},
		operations: {
			read: {
				id: true,
				author: 'authorReadable',
			},
		},
	},
	Author: {
		predicates: {
			authorVisible: { isActive: { eq: true } },
		},
		operations: {
			read: {
				id: 'authorVisible',
				name: 'authorVisible',
			},
		},
	},
}

test('order by through a relation combines the hop and target read predicates in the order-key guard', async () => {
	await execute({
		schema: hopSchema,
		permissions: hopAndTargetPermissions,
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
					order by case when ("root_"."is_published" = ?) and ("root_author"."is_active" = ?) then "root_author"."name" end asc, "root_"."id" asc
				`,
				parameters: [true, true],
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

const m2mSchema = new SchemaBuilder()
	.entity('Post', e =>
		e.manyHasMany('tags', r =>
			r.target('Tag', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.column('isDeleted', c => c.type(Model.ColumnType.Bool))
					.column('isPublic', c => c.type(Model.ColumnType.Bool)))))
	.buildSchema()

const m2mRootPermissions: Acl.Permissions = {
	Post: {
		predicates: {},
		operations: {
			read: {
				id: true,
				tags: true,
			},
		},
	},
	Tag: {
		predicates: {
			namePredicate: { isDeleted: { eq: false } },
		},
		operations: {
			read: {
				id: 'namePredicate',
				name: 'namePredicate',
			},
		},
	},
}

// A through grant widens the Tag row-level predicate, so `name` is cell-level in the `all` set
// while it equals the row-level predicate in the root set.
const m2mAllPermissions: Acl.Permissions = {
	...m2mRootPermissions,
	Tag: {
		predicates: {
			namePredicate: { isDeleted: { eq: false } },
			rowPredicate: { or: [{ isDeleted: { eq: false } }, { isPublic: { eq: true } }] },
		},
		operations: {
			read: {
				id: 'rowPredicate',
				name: 'namePredicate',
			},
		},
	},
}

test('order by on a many-has-many junction fetch guards the order key against the through (all) permission set', async () => {
	await execute({
		schema: m2mSchema,
		permissions: m2mRootPermissions,
		allPermissions: m2mAllPermissions,
		variables: {},
		query: GQL`
        query {
          listPost {
            id
            tags(orderBy: [{name: asc}], limit: 1) {
              id
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."post" as "root_"`,
				parameters: [],
				response: {
					rows: [{ root_id: testUuid(1) }],
				},
			},
			{
				// The junction WHERE filters rows by the `all`-set row predicate, so the order key of the
				// (all-set) cell-level `name` must be guarded — a row readable only through `isPublic` sorts as NULL.
				sql: SQL`with "data" as
					(select
						"junction_"."tag_id",
						"junction_"."post_id",
						row_number() over(partition by "junction_"."post_id"
							order by case when "root_"."is_deleted" = ? then "root_"."name" end asc, "root_"."id" asc) as "rowNumber_"
					from "public"."post_tags" as "junction_"
					inner join "public"."tag" as "root_" on "junction_"."tag_id" = "root_"."id"
					where "junction_"."post_id" in (?) and ("root_"."is_deleted" = ? or "root_"."is_public" = ?)
					order by case when "root_"."is_deleted" = ? then "root_"."name" end asc, "root_"."id" asc)
					select "data".* from "data" where "data"."rowNumber_" <= ?`,
				parameters: [false, testUuid(1), false, true, false, 1],
				response: {
					rows: [{ post_id: testUuid(1), tag_id: testUuid(10) }],
				},
			},
			{
				sql: SQL`select "root_"."id" as "root_id"
					from "public"."tag" as "root_"
					where "root_"."id" in (?) and ("root_"."is_deleted" = ? or "root_"."is_public" = ?)`,
				parameters: [testUuid(10), false, true],
				response: {
					rows: [{ root_id: testUuid(10) }],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						tags: [{ id: testUuid(10) }],
					},
				],
			},
		},
	})
})

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
