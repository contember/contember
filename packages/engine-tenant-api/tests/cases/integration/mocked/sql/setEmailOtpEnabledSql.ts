import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'

/** Mocks SetEmailOtpEnabledCommand: upsert person_mfa.email_otp_enabled. */
export const setEmailOtpEnabledSql = (args: { personId: string; enabled: boolean }): ExpectedQuery => ({
	sql:
		SQL`insert into "tenant"."person_mfa" ("person_id", "email_otp_enabled") values (?, ?) on conflict ("person_id") do update set "email_otp_enabled" = ?`,
	parameters: [args.personId, args.enabled, args.enabled],
	response: { rowCount: 1 },
})
