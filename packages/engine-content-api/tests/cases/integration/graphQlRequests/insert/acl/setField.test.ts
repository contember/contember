import { test } from 'uvu'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('set a name - allowed', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
					createAuthor(
						data: {name: "John"}
					) {
						ok
					}
				}`,
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
			name_variable: ['John', 'Jack'],
		},
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name")
insert into "public"."author" ("id", "name")
select "root_"."id", "root_"."name" from "root_" where "root_"."name" in (?, ?) returning "id"`,
					parameters: [testUuid(1), 'John', 'John', 'Jack'],
					response: { rows: [{ id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				createAuthor: {
					ok: true,
				},
			},
		},
	})
})

test('set a name - denied', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        createAuthor(
            data: {name: "Joe"}
          ) {
          ok
          errors {
            type
          }
        }
      }`,
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
			name_variable: ['John', 'Jack'],
		},
		executes: [
			...failedTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name")
insert into "public"."author" ("id", "name")
select "root_"."id", "root_"."name" from "root_" where "root_"."name" in (?, ?) returning "id"`,
					parameters: [testUuid(1), 'Joe', 'John', 'Jack'],
					response: { rows: [] },
				},
			]),
		],
		return: {
			data: {
				createAuthor: {
					ok: false,
					errors: [{ type: 'NotFoundOrDenied' }],
				},
			},
		},
	})
})

test.run()
