import { test } from 'vitest'
import { execute, sqlDeferred, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema, siteSettingSchemaWithOrphanRemoval } from './schema'

test('create', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {create: {url: "http://mangoweb.cz"}}}
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
				// {
				// 	sql: SQL`select "root_"."setting_id" as "root_setting", "root_"."id" as "root_id" from "public"."site" as "root_" where "root_"."id" = ?`,
				// 	parameters: [testUuid(2)],
				// 	response: { rows: [{ root_id: testUuid(2), root_setting: testUuid(99) }] },
				// },
				// {
				// 	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."site_setting" as "root_" where "root_"."id" in (?)`,
				// 	parameters: [testUuid(99)],
				// 	response: { rows: [{ root_id: testUuid(99) }] },
				// },
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "url")
							insert into "public"."site_setting" ("id", "url")
							select "root_"."id", "root_"."url"
              from "root_"
							returning "id"`,
					parameters: [testUuid(1), 'http://mangoweb.cz'],
					response: { rows: [{ id: testUuid(1) }] },
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

test('create - orphan removal', async () => {
	const siteId = testUuid(2)
	const currentSettingId = testUuid(3)
	await execute({
		schema: siteSettingSchemaWithOrphanRemoval,
		query: GQL`mutation {
        updateSite(
            by: {id: "${siteId}"},
            data: {setting: {create: {url: "http://mangoweb.cz"}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
					parameters: [siteId],
					response: { rows: [{ id: siteId }] },
				},
				// get current inverse side
				{
					sql: 'select "root_"."setting_id"  from "public"."site" as "root_"   where "root_"."id" = ?',
					parameters: [siteId],
					response: { rows: [{ setting_id: currentSettingId }] },
				},
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "url")
							insert into "public"."site_setting" ("id", "url")
							select "root_"."id", "root_"."url"
              from "root_"
							returning "id"`,
					parameters: [testUuid(1), 'http://mangoweb.cz'],
					response: { rows: [{ id: testUuid(1) }] },
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
					parameters: [testUuid(1), siteId],
					response: { rowCount: 1 },
				},
				...sqlDeferred([
					{
						sql: 'select "root_"."id"  from "public"."site_setting" as "root_"   where "root_"."id" = ?',
						parameters: [currentSettingId],
						response: { rows: [{ id: currentSettingId }] },
					},
					{
						sql: 'delete from "public"."site_setting"   where "id" in (select "root_"."id"  from "public"."site_setting" as "root_"   where "root_"."id" = ?)  returning "id"',
						parameters: [currentSettingId],
						response: { rows: [{ id: currentSettingId }] },
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
