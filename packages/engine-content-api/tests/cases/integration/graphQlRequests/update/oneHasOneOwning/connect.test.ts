import { test } from 'vitest'
import { execute, sqlDeferred, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema, siteSettingSchemaWithOrphanRemoval } from './schema'

test('connect - same owner', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {connect: {id: "${testUuid(1)}"}}}
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
					sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ id: testUuid(2) }],
					},
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

test('connect - no owner', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {connect: {id: "${testUuid(1)}"}}}
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
					sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [],
					},
				},
				{
					sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
					parameters: [testUuid(1), testUuid(2)],
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

test('connect - different owner', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {connect: {id: "${testUuid(1)}"}}}
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
					sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ id: testUuid(3) }],
					},
				},
				{
					sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
					parameters: [null, testUuid(3)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
					parameters: [testUuid(1), testUuid(2)],
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

test('connect - orphan removal', async () => {
	const settingId = testUuid(1)
	const siteId = testUuid(2)
	const settingId2 = testUuid(3)
	await execute({
		schema: siteSettingSchemaWithOrphanRemoval,
		query: GQL`mutation {
        updateSite(
            by: {id: "${siteId}"},
            data: {setting: {connect: {id: "${settingId}"}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				// the owner
				{
					sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
					parameters: [siteId],
					response: { rows: [{ id: siteId }] },
				},
				// new inverse
				{
					sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
					parameters: [settingId],
					response: { rows: [{ id: settingId }] },
				},
				// current inverse
				{
					sql: 'select "root_"."setting_id"  from "public"."site" as "root_"   where "root_"."id" = ?',
					parameters: [siteId],
					response: { rows: [{ setting_id: settingId2 }] },
				},
				// owner of new inverse
				{
					sql: 'select "root_"."id"  from "public"."site" as "root_"   where "root_"."setting_id" = ?',
					parameters: [settingId],
					response: { rows: [] },
				},
				{
					sql: 'with "newData_" as (select ? :: uuid as "setting_id", "root_"."id", "root_"."name"  from "public"."site" as "root_"   where "root_"."id" = ?) update  "public"."site" set  "setting_id" =  "newData_"."setting_id"   from "newData_"   where "site"."id" = "newData_"."id"',
					parameters: [settingId, siteId],
					response: { rowCount: 1 },
				},
				...sqlDeferred([
					{
						sql: 'select "root_"."id"  from "public"."site_setting" as "root_"   where "root_"."id" = ?',
						parameters: [settingId2],
						response: { rows: [{ id: settingId2 }] },
					},
					{
						sql: 'delete from "public"."site_setting"   where "id" in (select "root_"."id"  from "public"."site_setting" as "root_"   where "root_"."id" = ?)  returning "id"',
						parameters: [settingId2],
						response: { rows: [{ id: settingId2 }] },
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

