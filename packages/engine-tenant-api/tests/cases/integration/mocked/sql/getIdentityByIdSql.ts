import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'

/**
 * IdentityQuery used by ApiKeyManager.createSessionApiKey to fetch the
 * identity's global roles for A19 session-policy resolution.
 */
export const getIdentityByIdSql = (args: { identityId: string; roles?: string[] }): ExpectedQuery => ({
	sql: SQL`select "id", "description", "roles" from "tenant"."identity" where "id" in (?)`,
	parameters: [args.identityId],
	response: {
		rows: [{ id: args.identityId, description: null, roles: args.roles ?? [] }],
	},
})
