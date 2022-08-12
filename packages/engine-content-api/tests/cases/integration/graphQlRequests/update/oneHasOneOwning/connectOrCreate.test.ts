import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema } from './schema'

test('connect or create', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {connectOrCreate: {connect: {url: "xyz"}, create: {url: "abcd"}}}}
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
					sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."url" = ?`,
					parameters: ['xyz'],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."setting_id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [] },
				},
				{
					sql: `with "newData_" as (select ? :: uuid as "setting_id", "root_"."id", "root_"."name"  from "public"."site" as "root_"  where "root_"."id" = ?)
						update  "public"."site" set  "setting_id" =  "newData_"."setting_id"   from "newData_"  where "site"."id" = "newData_"."id"`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rowCount: 1 },
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
