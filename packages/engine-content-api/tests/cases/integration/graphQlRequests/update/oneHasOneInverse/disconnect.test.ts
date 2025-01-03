import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema } from './schema'

test('disconnect', async () => {
	const settingId = testUuid(2)
	const siteId = testUuid(1)
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${settingId}"},
            data: {site: {disconnect: true}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
					parameters: [settingId],
					response: { rows: [{ id: settingId }] },
				},
				{
					sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
					parameters: [settingId],
					response: {
						rows: [{ id: siteId }],
					},
				},
				{
					sql: SQL`with "newData_" as (select ? :: uuid as "setting_id", "root_"."setting_id" as "setting_id_old__", "root_"."id", "root_"."name"  from "public"."site" as "root_"  where "root_"."id" = ?) 
							update  "public"."site" set  "setting_id" =  "newData_"."setting_id"   from "newData_"  where "site"."id" = "newData_"."id"  returning "setting_id_old__"`,
					parameters: [null, siteId],
					response: { rows: [{ setting_id_old__: testUuid(99) }] },
				},
			]),
		],
		return: {
			data: {
				updateSiteSetting: {
					ok: true,
				},
			},
		},
	})
})

