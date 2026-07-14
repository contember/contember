import { ExpectedQuery } from '@contember/database-tester'

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
					THEN 0
					ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (
						LEAST(
							attempts.last_attempt + cfg.login_max_backoff,
							attempts.last_attempt + cfg.login_base_backoff * (POWER(2, attempts.attempts - 1))
						) - NOW()
					)))) END as "retry_after_seconds"  from "attempts", "cfg"`,
	parameters: [args.completionType, true, args.email, args.email, args.initType, true],
	// Default = "not rate-limited": the DB-computed backoff returns 0 seconds to
	// wait, so the manager's retryAfter > 0 check is false.
	response: args.response ?? {
		rows: [{ retry_after_seconds: 0 }],
	},
})
