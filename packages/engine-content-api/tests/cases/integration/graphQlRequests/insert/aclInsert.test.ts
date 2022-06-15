import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('insert author (with acl)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		permissions: {
			Author: {
				predicates: {
					name_predicate: { name: 'name_variable' },
				},
				operations: {
					create: {
						id: true,
						name: 'name_predicate',
					},
					read: {
						id: true,
					},
				},
			},
		},
		variables: {
			name_variable: {
				definition: {
					type: Acl.VariableType.condition,
				},
				value: [{ in: ['John', 'Jack'] }],
			},
		},
		query: GQL`
        mutation {
          createAuthor(data: {name: "John"}) {
		          node {
				          id
		          }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."author" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						where "root_"."name" in (?, ?)
						returning "id"`,
					parameters: [testUuid(1), 'John', 'John', 'Jack'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
			]),
		],
		return: {
			data: {
				createAuthor: {
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

