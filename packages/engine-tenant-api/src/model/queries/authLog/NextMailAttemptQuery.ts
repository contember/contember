import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { AuthActionType } from '../../type/AuthLog.js'

/**
 * Per-email exponential backoff for mail-sending init flows (password reset,
 * passwordless sign-in). Mirrors {@link NextLoginAttemptQuery} but counts
 * *successful* init events (= mails actually sent) against the same email, and
 * treats a successful completion (`completionType`) as the cutoff that resets
 * the backoff to zero.
 *
 * Reuses the existing `login_base_backoff` / `login_max_backoff` /
 * `login_attempt_window` knobs — see ConfigRateLimits docstring for the
 * rationale.
 */
export class NextMailAttemptQuery extends DatabaseQuery<number> {
	constructor(
		private readonly email: string,
		private readonly initType: AuthActionType,
		private readonly completionType: AuthActionType,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<number> {
		const qb = SelectBuilder.create()
			.with('cfg', it => it.from('config'))
			.with('last_completion', it =>
				it
					.select(new Literal('MAX(person_auth_log.created_at)'), 'created_at')
					.from('person_auth_log')
					.join('person', 'person', it => it.columnsEq(['person', 'id'], ['person_auth_log', 'person_id']))
					.where({
						type: this.completionType,
						success: true,
						email: this.email,
					}))
			.with('window_start', it =>
				it
					.select(
						new Literal(`
						GREATEST(
							COALESCE(last_completion.created_at, NOW() - cfg.login_attempt_window),
							NOW() - cfg.login_attempt_window
						)`),
						'start_time',
					)
					.from('cfg')
					.from('last_completion'))
			.with('attempts', it =>
				it
					.select(new Literal('COUNT(*)'), 'attempts')
					.select(new Literal('MAX(person_auth_log.created_at)'), 'last_attempt')
					.from('person_auth_log')
					.from('window_start')
					.where({
						person_input_identifier: this.email,
						type: this.initType,
						success: true,
					})
					.where(new Literal('person_auth_log.created_at >= window_start.start_time')))
			.select(
				new Literal(`
					CASE WHEN attempts.attempts = 0
					THEN 0
					ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (
						LEAST(
							attempts.last_attempt + cfg.login_max_backoff,
							attempts.last_attempt + cfg.login_base_backoff * (POWER(2, attempts.attempts - 1))
						) - NOW()
					)))) END`),
				'retry_after_seconds',
			)
			.from('attempts')
			.from('cfg')

		const result = await qb.getResult(db)
		if (result.length === 0) {
			return 0
		}
		return Number(result[0].retry_after_seconds)
	}
}
