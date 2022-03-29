import { Model } from '@contember/schema'
import { execute } from '../../src/test'
import { GQL, SQL } from '../../src/tags'
import { testUuid } from '../../src/testUuid'
import { SchemaBuilder } from '@contember/schema-definition'
import { test } from 'vitest'

const schema = new SchemaBuilder()
	.entity('Location', entity =>
		entity
			.column('name', column => column.type(Model.ColumnType.String))
			.manyHasOne('parent', c => c.target('Location')),
	)
	.entity('Pub', entity => entity.column('name').manyHasOne('location', relation => relation.target('Location')))

	.buildSchema()

const query = GQL`
query($location: UUID) {
	  pubs: listPub(
		  filter: {
			  or: [
				  {location: {id: {eq: $location}}},
				  {location: {parent: {id: {eq: $location}}}},
				  {location: {parent: {parent: {id: {eq: $location}}}}}
			  ]
		  }
	  ) {
		  id
		  name
	  }
  }
	`
test('Filter by "has one" multiple times with OR', async () => {
	await execute({
		schema: schema,
		query: query,
		queryVariables: { location: testUuid(1) },
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."name" as "root_name"
    from "public"."pub" as "root_"
    left join "public"."location" as "root_location" on "root_"."location_id" = "root_location"."id"
    left join "public"."location" as "root_location_parent" on "root_location"."parent_id" = "root_location_parent"."id"
    where ("root_"."location_id" = ? or "root_location"."parent_id" = ? or "root_location_parent"."parent_id" = ?)`,
				response: { rows: [{ root_id: testUuid(2), root_name: 'Foo' }] },
				parameters: [testUuid(1), testUuid(1), testUuid(1)],
			},
		],
		return: {
			data: {
				pubs: [
					{
						id: testUuid(2),
						name: 'Foo',
					},
				],
			},
		},
	})
})

test('Filter by "has one" multiple times with OR and with empty parameter', async () => {
	await execute({
		schema: schema,
		query: query,
		queryVariables: {},
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."name" as "root_name"
    from "public"."pub" as "root_"
    left join "public"."location" as "root_location" on "root_"."location_id" = "root_location"."id"
    left join "public"."location" as "root_location_parent" on "root_location"."parent_id" = "root_location_parent"."id"`,
				response: { rows: [{ root_id: testUuid(2), root_name: 'Foo' }] },
				parameters: [],
			},
		],
		return: {
			data: {
				pubs: [
					{
						id: testUuid(2),
						name: 'Foo',
					},
				],
			},
		},
	})
})


