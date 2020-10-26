import { AllowAllPermissionFactory, SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { execute, sqlTransaction } from '../../../../src/test'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'
import { test } from 'uvu'

test('insert author with id', async () => {
	const schema = new SchemaBuilder()
		.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema()
	await execute({
		schema: schema,
		query: GQL`
          mutation {
              createAuthor(data: {name: "John", id: "${testUuid(555)}"}) {
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
						returning "id"`,
					parameters: [testUuid(555), 'John'],
					response: { rows: [{ id: testUuid(555) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(555) }],
					},
					parameters: [testUuid(555)],
				},
			]),
		],
		return: {
			data: {
				createAuthor: {
					node: {
						id: testUuid(555),
					},
				},
			},
		},
		permissions: new AllowAllPermissionFactory().create(schema, true),
	})
})
test.run()
