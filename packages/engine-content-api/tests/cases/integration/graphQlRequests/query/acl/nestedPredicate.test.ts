import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

const schema = new SchemaBuilder()
	.enum('locale', ['cs', 'en'])
	.entity('Post', entityBuilder =>
		entityBuilder.manyHasOne('author', r =>
			r.target('Author', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.manyHasOne('country', r => r.target('Country', e => e.column('name', c => c.type(Model.ColumnType.String)))),
			),
		),
	)
	.buildSchema()

const permissions: Acl.Permissions = {
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
			countryPredicate: {
				country: {
					name: 'countryVariable',
				},
			},
		},
		operations: {
			read: {
				id: true,
				name: 'countryPredicate',
			},
		},
	},
	Country: {
		predicates: {},
		operations: {
			read: {
				id: true,
			},
		},
	},
}

test('querying post + author name', async () => {
	await execute({
		schema: schema,
		permissions: permissions,
		variables: {
			countryVariable: { in: ['Czechia'] },
		},
		query: GQL`
        query {
          listPost {
            id
            author {
              name
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select
                         "root_"."id" as "root_id",
                         "root_"."author_id" as "root_author"
                       from "public"."post" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root_author: testUuid(3),
						},
						{
							root_id: testUuid(2),
							root_author: testUuid(4),
						},
					],
				},
			},
			{
				sql: SQL`SELECT
							 "root_"."id" AS "root_id",
							 "root_country"."name" IN (?) AS "root___predicate_countryPredicate",
							 "root_"."name" AS "root_name",
							 "root_"."id" AS "root_id"
						 FROM "public"."author" AS "root_"
						 LEFT JOIN "public"."country" AS "root_country" ON "root_"."country_id" = "root_country"."id"
						 WHERE "root_"."id" IN (?, ?)`,
				parameters: ['Czechia', testUuid(3), testUuid(4)],
				response: {
					rows: [
						{
							root_id: testUuid(3),
							root___predicate_countryPredicate: true,
							root_name: 'John',
						},
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						author: {
							name: 'John',
						},
						id: testUuid(1),
					},
					{
						author: null,
						id: testUuid(2),
					},
				],
			},
		},
	})
})


