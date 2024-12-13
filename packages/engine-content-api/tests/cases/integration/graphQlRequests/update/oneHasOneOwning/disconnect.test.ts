import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema } from './schema'

test('disconnect', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {disconnect: true}}
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
					sql: SQL`with "newData_" as (select ? :: uuid as "setting_id", "root_"."setting_id" as "setting_id_old__", "root_"."id", "root_"."name"  from "public"."site" as "root_"  where "root_"."id" = ?) 
						update  "public"."site" set  "setting_id" =  "newData_"."setting_id"   from "newData_"  where "site"."id" = "newData_"."id"  returning "setting_id_old__"`,
					parameters: [null, testUuid(2)],
					response: { rows: [{ setting_id_old__: testUuid(99) }] },
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

