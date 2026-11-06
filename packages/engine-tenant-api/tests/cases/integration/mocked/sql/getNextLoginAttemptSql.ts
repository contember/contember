import { ExpectedQuery } from '@contember/database-tester'

export const getNextLoginAttemptSql = (key: { personId: string } | { normalizedEmail: string }): ExpectedQuery => {
	const resetCondition = 'personId' in key ? `"person_id" = ?` : 'false'
	const failedCondition = 'personId' in key ? `"person_id" = ?` : `"person_id" is null and "person_input_identifier" = ?`
	return {
		sql:
			`with "cfg" as (select *  from "tenant"."config"), "last_successful_reset" as (select MAX(person_auth_log.created_at) as "created_at"  from "tenant"."person_auth_log"  where "type" = ? and "success" = ? and ${resetCondition}), "window_start" as (select
					GREATEST(
						COALESCE(last_successful_reset.created_at, NOW() - cfg.login_attempt_window),
						NOW() - cfg.login_attempt_window
					) as "start_time"  from "cfg", "last_successful_reset"), "failed_logins" as (select COUNT(*) as "fails", MAX(person_auth_log.created_at) as "last_fail"  from "tenant"."person_auth_log", "window_start"  where "type" = ? and "success" = ? and ${failedCondition} and person_auth_log.created_at >= window_start.start_time) select
				CASE WHEN failed_logins.fails = 0
				THEN 0
				ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (
					LEAST(
						failed_logins.last_fail + cfg.login_max_backoff,
						failed_logins.last_fail + cfg.login_base_backoff * (POWER(2, failed_logins.fails - 1))
					) - NOW()
				)))) END as "retry_after_seconds"  from "failed_logins", "cfg"`,
		parameters: 'personId' in key
			? ['password_reset', true, key.personId, 'login', false, key.personId]
			: ['password_reset', true, 'login', false, key.normalizedEmail],
		// Default = "not rate-limited": no failed logins in the window, so the
		// DB-computed backoff returns 0 seconds to wait.
		response: {
			rows: [],
		},
	}
}
