import { SchemaBuilder } from '@contember/schema-definition'
import { Acl } from '@contember/schema'
import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

const schema = new SchemaBuilder().entity('Author', e => e.column('username')).buildSchema()

const permissions: Acl.Permissions = {
	Author: {
		predicates: {
			authorPredicate: {
				username: { eq: 'johndoe' },
			},
		},
		operations: {
			read: {
				id: 'authorPredicate',
				username: 'authorPredicate',
			},
		},
	},
}

test('same predicate on row and field level', async () => {
	await execute({
		schema: schema,
		permissions: permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor {
            id
            username
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id", "root_"."username" as "root_username"
					from "public"."author" as "root_"
					where "root_"."username" = ?
				`,
				parameters: ['johndoe'],
				response: {
					rows: [
						{
							root_id: testUuid(1),
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


