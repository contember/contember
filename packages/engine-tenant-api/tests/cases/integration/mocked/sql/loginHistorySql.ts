import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export type PriorLoginRow = {
	geoCountry?: string | null
	deviceFingerprint?: string | null
	ip?: string | null
}

/**
 * Mocks `LoginRiskAnalyzer.analyze`'s history lookup: the person's last N
 * successful interactive sign-ins (password / IdP / passwordless), newest first.
 * Only runs when anomaly detection is enabled in config.
 */
export const getLoginHistorySql = (args: { personId: string; limit?: number; rows?: PriorLoginRow[] }): ExpectedQuery => ({
	sql: SQL`select "person_auth_log"."geo_country", "person_auth_log"."device_fingerprint", "person_auth_log"."ip_address"
		from "tenant"."person_auth_log"
		where "person_auth_log"."person_id" = ? and "person_auth_log"."type" in (?, ?, ?) and "person_auth_log"."success" = ?
		order by "person_auth_log"."created_at" desc
		limit ${String(args.limit ?? 10)}`,
	parameters: [args.personId, 'login', 'idp_login', 'passwordless_login', true],
	response: {
		rows: (args.rows ?? []).map(row => ({
			geo_country: row.geoCountry ?? null,
			device_fingerprint: row.deviceFingerprint ?? null,
			ip_address: row.ip ?? null,
		})),
	},
})
