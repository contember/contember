import { test } from 'vitest'
import { execute, sqlDeferred, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema, siteSettingSchemaWithOrphanRemoval } from './schema'

test('connect - same owner', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {connect: {id: "${testUuid(1)}"}}}
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
					sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ id: testUuid(1) }],
					},
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
test('connect - no owner', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {connect: {id: "${testUuid(1)}"}}}
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
					sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ id: testUuid(1) }],
					},
				},
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
					sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "setting_id",
                 "root_"."id",
                 "root_"."name"
               from "public"."site" as "root_"
               where "root_"."id" = ?) update "public"."site"
              set "setting_id" = "newData_"."setting_id" from "newData_"
              where "site"."id" = "newData_"."id"`,
					parameters: [testUuid(2), testUuid(1)],
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

test('connect - different owner', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {connect: {id: "${testUuid(1)}"}}}
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
					sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ id: testUuid(1) }],
					},
				},
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
					parameters: [testUuid(2), testUuid(1)],
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

test('connect - different owner & orphan removal enabled', async () => {
	await execute({
		schema: siteSettingSchemaWithOrphanRemoval,
		query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {connect: {id: "${testUuid(1)}"}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				// inverse side
				{
					sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				// new owner
				{
					sql: SQL`select "root_"."id" from "public"."site" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ id: testUuid(1) }],
					},
				},
				// current owner
				{
					sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ id: testUuid(3) }],
					},
				},
				// set current owner to null
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
				// current inverse of new owner
				{
					sql: 'select "root_"."setting_id"  from "public"."site" as "root_"   where "root_"."id" = ?',
					parameters: [testUuid(1)],
					response: { rows: [{ setting_id: testUuid(4) }] },
				},
				// update inverse of new owner
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
					parameters: [testUuid(2), testUuid(1)],
					response: { rowCount: 1 },
				},
				// delete orphaned inverse side
				...sqlDeferred([
					{
						sql: 'select "root_"."id"  from "public"."site_setting" as "root_"   where "root_"."id" = ?',
						parameters: [testUuid(4)],
						response: { rows: [{ id: testUuid(4) }] },
					},
					{
						sql: 'delete from "public"."site_setting"   where "id" in (select "root_"."id"  from "public"."site_setting" as "root_"   where "root_"."id" = ?)  returning "id"',
						parameters: [testUuid(4)],
						response: { rows: [{ id: testUuid(4) }] },
					},
				]),

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
