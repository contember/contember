import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export const getIdentityProjectMembershipPresenceSql = (
	identityId: string,
	hasProjectMemberships = false,
): ExpectedQuery => ({
	sql: SQL`select  distinct on ("identity_id") "identity_id"  from "tenant"."project_membership"  where "identity_id" in (?)`,
	parameters: [identityId],
	response: { rows: hasProjectMemberships ? [{ identity_id: identityId }] : [] },
})
