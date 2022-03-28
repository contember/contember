import { SchemaBuilder } from '@contember/schema-definition'
import { Acl } from '@contember/schema'
import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

const schema = new SchemaBuilder()
	.entity('Author', e => e.column('firstName').column('lastName').column('username'))
	.buildSchema()

const permissions: Acl.Permissions = {
	Author: {
		predicates: {
			authorPredicate: {
				or: [
					{
						firstName: { eq: 'John' },
						lastName: { eq: 'Doe' },
					},
					{
						username: { eq: 'johndoe' },
					},
				],
			},
		},
		operations: {
			read: {
				id: 'authorPredicate',
			},
		},
	},
}

test('predicate with OR', async () => {
	await execute({
		schema: schema,
		permissions: permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id" from "public"."author" as "root_"
					where ("root_"."first_name" = ? and "root_"."last_name" = ? or "root_"."username" = ?)`,
				parameters: ['John', 'Doe', 'johndoe'],
				response: {
					rows: [
						{
							root_id: testUuid(1),
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
					},
				],
			},
		},
	})
})


