import { ExpectedQuery } from '@contember/database-tester'
import { TOTP } from 'otpauth'
import { SQL } from '../../../../src/tags.js'

/** The claim `OtpManager.verifyOtp` runs for a TOTP code valid at `now`; `accepted: false` simulates a replayed code. */
export const claimTotpCounterSql = (args: { personId: string; now: Date; accepted?: boolean }): ExpectedQuery => {
	const counter = TOTP.counter({ timestamp: args.now.getTime() })
	return {
		sql: SQL`update "tenant"."person_mfa" set "totp_last_counter" = ?
			where "person_id" = ? and ("totp_last_counter" is null or "totp_last_counter" < ?)`,
		parameters: [counter, args.personId, counter],
		response: { rowCount: args.accepted === false ? 0 : 1 },
	}
}
