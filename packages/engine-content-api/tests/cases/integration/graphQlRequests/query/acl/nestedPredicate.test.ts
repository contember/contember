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
			countryVariable: ['Czechia'],
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
				sql: SQL`select
                         "root_"."id" as "root_id",
                         case when "root_country"."name" in (?) then "root_"."name" else null end as "root_name",
                         "root_"."id" as "root_id"
                       from "public"."author" as "root_" left join "public"."country" as "root_country" on "root_"."country_id" = "root_country"."id"
                       where "root_"."id" in (?, ?)`,
				parameters: ['Czechia', testUuid(3), testUuid(4)],
				response: {
					rows: [
						{
							root_id: testUuid(3),
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


