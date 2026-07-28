import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

type CustomRoleRow = {
	id: string
	slug: string
	description: string | null
	grants: unknown
	created_at: Date
	updated_at: Date
}

/** Request-scoped lookup used when a custom role participates in authorization. */
export const getCustomRolesSql = (response: CustomRoleRow[] = []): ExpectedQuery => ({
	sql: SQL`select *  from "tenant"."custom_role"  order by "slug" asc`,
	parameters: [],
	response: { rows: response },
})

/** Locked role lookup used before assigning or referencing a custom role. */
export const getCustomRolesForValidationSql = (args: { slugs: string[]; response?: CustomRoleRow[] }): ExpectedQuery => ({
	sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc for share`,
	parameters: args.slugs,
	response: { rows: args.response ?? [] },
})
