import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('insert json object', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Foo', entity => entity.column('data', c => c.type(Model.ColumnType.Json)))
			.buildSchema(),
		query: GQL`
          mutation {
              createFoo(data: {data: {foo: "value"}}) {
                  ok
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: jsonb as "data") insert into "public"."foo" ("id", "data") select "root_"."id", "root_"."data" from "root_" returning "id"`,
					parameters: [testUuid(1), '{"foo":"value"}'],
					response: { rows: [{ id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				createFoo: {
					ok: true,
				},
			},
		},
	})
})

