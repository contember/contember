import { ExpectedQuery } from '@contember/database-tester'

export const getNextLoginAttemptSql = (email: string): ExpectedQuery => ({
	sql: `with "cfg" as (select *  from "tenant"."config"), "last_successful_reset" as (select MAX(person_auth_log.created_at) as "created_at"  from "tenant"."person_auth_log" inner join  "tenant"."person" as "person" on  "person"."id" = "person_auth_log"."person_id"  where "type" = ? and "success" = ? and "email" = ?), "window_start" as (select
                                        GREATEST(
                                                COALESCE(last_successful_reset.created_at, NOW() - cfg.login_attempt_window),
                                                NOW() - cfg.login_attempt_window
                                        ) as "start_time"  from "cfg", "last_successful_reset"), "failed_logins" as (select COUNT(*) as "fails", MAX(person_auth_log.created_at) as "last_fail"  from "tenant"."person_auth_log", "window_start"  where "person_input_identifier" = ? and "type" = ? and "success" = ? and person_auth_log.created_at >= window_start.start_time) select
                                CASE WHEN failed_logins.fails = 0
                                THEN NOW()
                                ELSE LEAST(
                                        failed_logins.last_fail + cfg.login_max_backoff,
                                        failed_logins.last_fail + cfg.login_base_backoff * (POWER(2, failed_logins.fails - 1))
                                ) END as "next_allowed_login"  from "failed_logins", "cfg"`,
	parameters: ['password_reset', true, email, email, 'login', false],
	response: {
		rows: [
		],
	},
})
