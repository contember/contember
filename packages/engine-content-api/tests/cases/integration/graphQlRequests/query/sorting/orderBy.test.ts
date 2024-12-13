import { test } from 'bun:test'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Entity - explicit order by, default asc', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)).orderBy('title'))
			.buildSchema(),
		query: GQL`
        query {
          getPost(by: {id: "${testUuid(1)}"}, filter: {title: {eq: "Foo"}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ? and "root_"."title" = ?  order by "root_"."title" asc, "root_"."id" asc`,
				response: { rows: [{ root_id: testUuid(1) }] },
				parameters: [testUuid(1), 'Foo'],
			},
		],
		return: {
			data: {
				getPost: {
					id: testUuid(1),
				},
			},
		},
	})
})


test('Entity - explicit order by desc', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)).orderBy('title', Model.OrderDirection.desc))
			.buildSchema(),
		query: GQL`
        query {
          getPost(by: {id: "${testUuid(1)}"}, filter: {title: {eq: "Foo"}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ? and "root_"."title" = ?  order by "root_"."title" desc, "root_"."id" asc`,
				response: { rows: [{ root_id: testUuid(1) }] },
				parameters: [testUuid(1), 'Foo'],
			},
		],
		return: {
			data: {
				getPost: {
					id: testUuid(1),
				},
			},
		},
	})
})
