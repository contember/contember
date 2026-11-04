import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

// A client chooses GraphQL aliases freely, and they become SQL column aliases. Engine-owned columns (ACL predicate
// results, relation keys) must stay in a namespace no alias can reach, otherwise the client's column is read instead.

const schema = new SchemaBuilder()
	.entity('Author', entity =>
		entity
			.column('name', column => column.type(Model.ColumnType.String))
			.column('verified', column => column.type(Model.ColumnType.Bool)))
	.entity('Post', entity =>
		entity
			.column('externalId', column => column.type(Model.ColumnType.Uuid))
			.manyHasOne('author', relation => relation.target('Author')))
	.buildSchema()

const longPredicateName = 'nameVisible' + 'Long'.repeat(13)

const permissions: Acl.Permissions = {
	Author: {
		predicates: {
			nameVisible: { verified: { eq: true } },
			[longPredicateName]: { verified: { eq: true } },
		},
		operations: {
			read: { id: true, verified: true, name: 'nameVisible' },
			update: { name: 'nameVisible' },
		},
	},
	Post: {
		predicates: {},
		operations: {
			read: { id: true, externalId: true, author: true },
		},
	},
}

test('a root alias equal to a predicate column does not unmask the field', async () => {
	await execute({
		schema,
		permissions,
		query: GQL`
			query {
				listAuthor {
					id
					name
					__predicate_nameVisible: verified
				}
			}`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id",
					       "root_"."verified" = ? as "root_$predicate_nameVisible",
					       "root_"."name" as "root_name",
					       "root_"."verified" as "root___predicate_nameVisible"
					from "public"."author" as "root_"`,
				parameters: [true],
				response: {
					rows: [
						{
							'root_id': testUuid(1),
							'root_$predicate_nameVisible': false,
							'root_name': 'masked',
							'root___predicate_nameVisible': true,
						},
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [{ id: testUuid(1), name: null, __predicate_nameVisible: true }],
			},
		},
	})
})

test('a nested alias equal to a predicate column does not unmask the field', async () => {
	await execute({
		schema,
		permissions,
		query: GQL`
			query {
				listPost {
					id
					author {
						id
						name
						__predicate_nameVisible: verified
					}
				}
			}`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id",
					       "root_"."author_id" as "root_$key_author"
					from "public"."post" as "root_"`,
				parameters: [],
				response: {
					rows: [{ 'root_id': testUuid(1), 'root_$key_author': testUuid(2) }],
				},
			},
			{
				sql: SQL`
					select "root_"."id" as "root_$index_id",
					       "root_"."id" as "root_id",
					       "root_"."verified" = ? as "root_$predicate_nameVisible",
					       "root_"."name" as "root_name",
					       "root_"."verified" as "root___predicate_nameVisible"
					from "public"."author" as "root_"
					where "root_"."id" in (?)`,
				parameters: [true, testUuid(2)],
				response: {
					rows: [
						{
							'root_$index_id': testUuid(2),
							'root_id': testUuid(2),
							'root_$predicate_nameVisible': false,
							'root_name': 'masked',
							'root___predicate_nameVisible': true,
						},
					],
				},
			},
		],
		return: {
			data: {
				listPost: [{ id: testUuid(1), author: { id: testUuid(2), name: null, __predicate_nameVisible: true } }],
			},
		},
	})
})

test('an alias equal to a predicate column does not change _meta.updatable', async () => {
	await execute({
		schema,
		permissions,
		query: GQL`
			query {
				listAuthor {
					id
					__predicate_nameVisible: verified
					_meta {
						name {
							updatable
						}
					}
				}
			}`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id",
					       "root_"."verified" as "root___predicate_nameVisible",
					       "root_"."verified" = ? as "root_$predicate_nameVisible"
					from "public"."author" as "root_"`,
				parameters: [true],
				response: {
					rows: [
						{
							'root_id': testUuid(1),
							'root___predicate_nameVisible': true,
							'root_$predicate_nameVisible': false,
						},
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [{ id: testUuid(1), __predicate_nameVisible: true, _meta: { name: { updatable: false } } }],
			},
		},
	})
})

test('aliases over the identifier length limit stay apart from predicate columns', async () => {
	const longPermissions: Acl.Permissions = {
		...permissions,
		Author: {
			...permissions.Author,
			operations: {
				read: { id: true, verified: true, name: longPredicateName },
			},
		},
	}
	await execute({
		schema,
		permissions: longPermissions,
		query: `
			query {
				listAuthor {
					id
					name
					__predicate_${longPredicateName}: verified
				}
			}`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id",
					       "root_"."verified" = ? as "root_$predicate_nameVisibleLongLongLongLongLongLongLongLongLo_1",
					       "root_"."name" as "root_name",
					       "root_"."verified" as "root___predicate_nameVisibleLongLongLongLongLongLongLongLongL_2"
					from "public"."author" as "root_"`,
				parameters: [true],
				response: {
					rows: [
						{
							'root_id': testUuid(1),
							'root_$predicate_nameVisibleLongLongLongLongLongLongLongLongLo_1': false,
							'root_name': 'masked',
							'root___predicate_nameVisibleLongLongLongLongLongLongLongLongL_2': true,
						},
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [{ id: testUuid(1), name: null, [`__predicate_${longPredicateName}`]: true }],
			},
		},
	})
})

test('an alias equal to a relation field does not replace the relation key', async () => {
	await execute({
		schema,
		permissions,
		query: GQL`
			query {
				listPost {
					id
					writer: author {
						id
					}
					author: externalId
				}
			}`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id",
					       "root_"."author_id" as "root_$key_author",
					       "root_"."external_id" as "root_author"
					from "public"."post" as "root_"`,
				parameters: [],
				response: {
					rows: [{ 'root_id': testUuid(1), 'root_$key_author': testUuid(2), 'root_author': testUuid(9) }],
				},
			},
			{
				sql: SQL`
					select "root_"."id" as "root_$index_id",
					       "root_"."id" as "root_id"
					from "public"."author" as "root_"
					where "root_"."id" in (?)`,
				parameters: [testUuid(2)],
				response: {
					rows: [{ 'root_$index_id': testUuid(2), 'root_id': testUuid(2) }],
				},
			},
		],
		return: {
			data: {
				listPost: [{ id: testUuid(1), writer: { id: testUuid(2) }, author: testUuid(9) }],
			},
		},
	})
})
