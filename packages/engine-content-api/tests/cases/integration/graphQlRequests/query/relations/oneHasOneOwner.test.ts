import { test } from 'uvu'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Sites with settings (one-has-one owner)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Site', entity =>
				entity
					.column('name', column => column.type(Model.ColumnType.String))
					.oneHasOne('setting', relation => relation.target('SiteSetting')),
			)
			.entity('SiteSetting', entity => entity.column('url', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`query {
        listSite {
          id
          name
          setting {
            id
            url
          }
        }
      }`,
		executes: [
			{
				sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."name" as "root_name",
                "root_"."setting_id" as "root_setting"
              from "public"."site" as "root_"`,

				response: {
					rows: [
						{
							root_id: testUuid(1),
							root_name: 'Site 1',
							root_setting: testUuid(2),
						},
						{
							root_id: testUuid(3),
							root_name: 'Site 2',
							root_setting: testUuid(4),
						},
					],
				},
			},
			{
				sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."id" as "root_id",
                "root_"."url" as "root_url"
              from "public"."site_setting" as "root_"
              where "root_"."id" in (?, ?)
						`,
				parameters: [testUuid(2), testUuid(4)],
				response: {
					rows: [
						{
							root_id: testUuid(2),
							root_url: 'http://site1.cz',
						},
						{
							root_id: testUuid(4),
							root_url: 'http://site2.cz',
						},
					],
				},
			},
		],
		return: {
			data: {
				listSite: [
					{
						id: testUuid(1),
						name: 'Site 1',
						setting: {
							id: testUuid(2),
							url: 'http://site1.cz',
						},
					},
					{
						id: testUuid(3),
						name: 'Site 2',
						setting: {
							id: testUuid(4),
							url: 'http://site2.cz',
						},
					},
				],
			},
		},
	})
})
test.run()
