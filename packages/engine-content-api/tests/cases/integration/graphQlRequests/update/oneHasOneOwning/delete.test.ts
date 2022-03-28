import { test } from 'vitest'
import { execute, sqlDeferred, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema } from './schema'

test('delete', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {delete: true}}
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
				...sqlDeferred([
					{
						sql: SQL`delete from "public"."site_setting"
              where "id" in (select "root_"."id"
                             from "public"."site_setting" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`
								with "newdata_" as
								(select ? :: uuid as "setting_id", "root_"."id", "root_"."name"
									from "public"."site" as "root_"
									where "root_"."setting_id" in (?))
								update "public"."site"
								set "setting_id" = "newdata_"."setting_id" from "newdata_"
								where "site"."id" = "newdata_"."id"`,
						parameters: [null, testUuid(1)],
						response: {
							rowCount: 1,
						},
					},
				]),
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

