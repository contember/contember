import { JSONValue } from '@contember/schema'
import { IdentityProviderRow } from '../../../model/queries/idp/types.js'

export const idpRowToAuditSnapshot = (row: IdentityProviderRow | null): JSONValue => {
	if (!row) {
		return null
	}
	return {
		slug: row.slug,
		type: row.type,
		disabledAt: row.disabledAt ? row.disabledAt.toISOString() : null,
		autoSignUp: row.autoSignUp,
		exclusive: row.exclusive,
		initReturnsConfig: row.initReturnsConfig,
		requireVerifiedEmail: row.requireVerifiedEmail,
		assumeEmailVerified: row.assumeEmailVerified,
		configurationKeys: Object.keys(row.configuration).sort(),
	}
}
