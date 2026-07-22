import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

type CustomRoleRow = {
	id: string
	slug: string
	description: string | null
	permissions: string[]
	created_at: Date
	updated_at: Date
}

/**
 * The CustomRoleAccessEvaluator lookup — fired once per PermissionContext when the
 * identity carries a non-builtin global role and the static permission check denies.
 */
export const getCustomRolesSql = (args: { slugs: string[]; response?: CustomRoleRow[] }): ExpectedQuery => ({
	sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc`,
	parameters: args.slugs,
	response: { rows: args.response ?? [] },
})
