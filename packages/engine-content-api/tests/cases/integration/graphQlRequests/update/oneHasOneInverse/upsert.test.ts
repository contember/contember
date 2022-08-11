import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema } from './schema'

test('upsert - exists', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {upsert: {update: {name: "Mangoweb"}, create: {name: "Mgw"}}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ id: testUuid(1) }],
					},
				},
				{
					sql: SQL`
						with "newData_" as
						(select ? :: text as "name", "root_"."id", "root_"."setting_id"  from "public"."site" as "root_"  where "root_"."id" = ?)
						update  "public"."site" set  "name" =  "newData_"."name"
						from "newData_"  where "site"."id" = "newData_"."id"
					`,
					parameters: ['Mangoweb', testUuid(1)],
					response: { rowCount: 1 },
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
test('upsert - not exists', async () => {
	const settingId = testUuid(2)
	const siteId = testUuid(1)
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${settingId}"},
           data: {site: {upsert: {update: {name: "Mangoweb"}, create: {name: "Mgw"}}}}
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
						rows: [],
					},
				},
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "name", ? :: uuid as "setting_id")
							insert into "public"."site" ("id", "name", "setting_id")
							select "root_"."id", "root_"."name", "root_"."setting_id"
              from "root_"
							returning "id"`,
					parameters: [siteId, 'Mgw', settingId],
					response: { rows: [{ id: siteId }] },
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

