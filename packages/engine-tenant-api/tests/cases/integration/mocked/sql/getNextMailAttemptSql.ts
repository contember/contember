import { ExpectedQuery } from '@contember/database-tester'
import { now } from '../../../../src/testTenant.js'

export const getNextMailAttemptSql = (args: {
	email: string
	initType: string
	completionType: string
	response?: ExpectedQuery['response']
}): ExpectedQuery => ({
	sql:
		`with "cfg" as (select *  from "tenant"."config"), "last_completion" as (select MAX(person_auth_log.created_at) as "created_at"  from "tenant"."person_auth_log" inner join  "tenant"."person" as "person" on  "person"."id" = "person_auth_log"."person_id"  where "type" = ? and "success" = ? and "email" = ?), "window_start" as (select
						GREATEST(
							COALESCE(last_completion.created_at, NOW() - cfg.login_attempt_window),
							NOW() - cfg.login_attempt_window
						) as "start_time"  from "cfg", "last_completion"), "attempts" as (select COUNT(*) as "attempts", MAX(person_auth_log.created_at) as "last_attempt"  from "tenant"."person_auth_log", "window_start"  where "person_input_identifier" = ? and "type" = ? and "success" = ? and person_auth_log.created_at >= window_start.start_time) select
					CASE WHEN attempts.attempts = 0
					THEN NOW()
					ELSE LEAST(
						attempts.last_attempt + cfg.login_max_backoff,
						attempts.last_attempt + cfg.login_base_backoff * (POWER(2, attempts.attempts - 1))
					) END as "next_allowed_attempt"  from "attempts", "cfg"`,
	parameters: [args.completionType, true, args.email, args.email, args.initType, true],
	// Default = "not rate-limited": a `next_allowed_attempt` at the mocked `now`,
	// so the manager's `nextAllowed > providers.now()` check is false. (An empty
	// result set would make the query fall back to a real `new Date()`, which is
	// in the future relative to the mocked clock and would read as rate-limited.)
	response: args.response ?? {
		rows: [{ next_allowed_attempt: now }],
	},
})
