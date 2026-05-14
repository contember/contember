import { JSONValue } from '@contember/schema'
import { IdentityProviderRow } from '../../../model/queries/idp/types'

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
		configurationKeys: Object.keys(row.configuration).sort(),
	}
}
