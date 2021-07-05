import { test } from 'uvu'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema } from './schema'

test('create', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {create: {name: "Mangoweb"}}}
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
				// {
				// 	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
				// 	parameters: [testUuid(2)],
				// 	response: {
				// 		rows: [{ root_id: testUuid(2) }],
				// 	},
				// },
				// {
				// 	sql: SQL`select "root_"."setting_id" as "root_setting", "root_"."id" as "root_id" from "public"."site" as "root_" where "root_"."setting_id" in (?)`,
				// 	parameters: [testUuid(2)],
				// 	response: {
				// 		rows: [{ root_id: testUuid(99), root_setting: testUuid(2) }],
				// 	},
				// },
				{
					sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ id: testUuid(3) }],
					},
				},
				{
					sql: SQL`
						with "newData_" as
						(select ? :: uuid as "setting_id", "root_"."id", "root_"."name"  from "public"."site" as "root_"  where "root_"."id" = ?)
						update  "public"."site" set  "setting_id" =  "newData_"."setting_id"
						from "newData_"  where "site"."id" = "newData_"."id"
					`,
					parameters: [null, testUuid(3)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "name", ? :: uuid as "setting_id")
							insert into "public"."site" ("id", "name", "setting_id")
							select "root_"."id", "root_"."name", "root_"."setting_id"
              from "root_"
							returning "id"`,
					parameters: [testUuid(1), 'Mangoweb', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
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
test('create - no owner', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {create: {name: "Mangoweb"}}}
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
				// {
				// 	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
				// 	parameters: [testUuid(2)],
				// 	response: {
				// 		rows: [{ root_id: testUuid(2) }],
				// 	},
				// },
				// {
				// 	sql: SQL`select "root_"."setting_id" as "root_setting", "root_"."id" as "root_id" from "public"."site" as "root_" where "root_"."setting_id" in (?)`,
				// 	parameters: [testUuid(2)],
				// 	response: {
				// 		rows: [{ root_id: testUuid(99), root_setting: testUuid(2) }],
				// 	},
				// },
				{
					sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
					parameters: [testUuid(2)],
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
					parameters: [testUuid(1), 'Mangoweb', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
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
test.run()
