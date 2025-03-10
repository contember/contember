import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema } from './schema'

test('update', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {update: {url: "http://mangoweb.cz"}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."setting_id"
                       from "public"."site" as "root_"
                       where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ setting_id: testUuid(1) }],
					},
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "url", "root_"."url" as "url_old__", "root_"."id"  from "public"."site_setting" as "root_"  where "root_"."id" = ?) 
							update  "public"."site_setting" set  "url" =  "newData_"."url"   from "newData_"  where "site_setting"."id" = "newData_"."id"  returning "url_old__"`,
					parameters: ['http://mangoweb.cz', testUuid(1)],
					response: { rows: [{ url_old__: 'https://google.com' }] },
				},
			]),
		],
		return: {
			data: {
				updateSite: {
					ok: true,
				},
			},
		},
	})
})

