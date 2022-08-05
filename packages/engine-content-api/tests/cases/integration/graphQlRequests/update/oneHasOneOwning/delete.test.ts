import { test } from 'vitest'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test'
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
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."setting_id" as "ref", true as "allowed" from "public"."site" as "root_" where "setting_id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2), ref: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."site_setting" where "id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
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


test('delete denied', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSite(
            by: {id: "${testUuid(2)}"},
            data: {setting: {delete: true}}
          ) {
          ok
          errorMessage
        }
      }`,
		executes: [
			...failedTransaction([
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
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."setting_id" as "ref", true as "allowed" from "public"."site" as "root_" where "setting_id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2), ref: testUuid(1), allowed: false }] },
				},
			]),
		],
		return: {
			data: {
				updateSite: {
					ok: false,
					errorMessage: 'Execution has failed:\n'
					+ 'setting: ForeignKeyConstraintViolation (Cannot delete 123e4567-e89b-12d3-a456-000000000001 row(s) of entity SiteSetting, because it is still referenced from 123e4567-e89b-12d3-a456-000000000002 row(s) of entity Site in relation setting. OnDelete behaviour of this relation is set to "set null". This is possibly caused by ACL denial.)',
				},
			},
		},
	})
})

