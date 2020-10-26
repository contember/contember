import { test } from 'uvu'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Settings with sites (one-has-one inversed)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Site', entity =>
				entity
					.column('name', column => column.type(Model.ColumnType.String))
					.oneHasOne('setting', relation => relation.target('SiteSetting').inversedBy('site')),
			)
			.entity('SiteSetting', entity => entity.column('url', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`query {
        listSiteSetting {
          id
          url
          site {
            id
            name
          }
        }
      }`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."url" as "root_url",
                       "root_"."id" as "root_id"
                     from "public"."site_setting" as "root_"`,
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root_url: 'http://site1.cz',
						},
						{
							root_id: testUuid(3),
							root_url: 'http://site2.cz',
						},
					],
				},
			},
			{
				sql: SQL`select
                       "root_"."setting_id" as "root_setting",
                       "root_"."id" as "root_id",
                       "root_"."name" as "root_name"
                     from "public"."site" as "root_"
                     where "root_"."setting_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(3)],
				response: {
					rows: [
						{
							root_id: testUuid(2),
							root_setting: testUuid(1),
							root_name: 'Site 1',
						},
						{
							root_id: testUuid(4),
							root_setting: testUuid(3),
							root_name: 'Site 2',
						},
					],
				},
			},
		],
		return: {
			data: {
				listSiteSetting: [
					{
						id: testUuid(1),
						url: 'http://site1.cz',
						site: {
							id: testUuid(2),
							name: 'Site 1',
						},
					},
					{
						id: testUuid(3),
						url: 'http://site2.cz',
						site: {
							name: 'Site 2',
							id: testUuid(4),
						},
					},
				],
			},
		},
	})
})
test.run()
