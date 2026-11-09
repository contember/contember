import { DatabaseQuery, DatabaseQueryable, Literal, Operator, SelectBuilder } from '@contember/database'

/**
 * Seconds until the next sign-in attempt is allowed. A known person is keyed by its id, so every spelling of its
 * address shares one counter; an unknown address is keyed by its normalized form, as recorded for UNKNOWN_EMAIL.
 */
export class NextLoginAttemptQuery extends DatabaseQuery<number> {
	constructor(
		private readonly key: { readonly personId: string } | { readonly normalizedEmail: string },
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<number> {
		const key = this.key
		const qb = SelectBuilder.create()
			.with('cfg', it => it.from('config'))
			.with('last_successful_reset', it => {
				const resets = it
					.select(new Literal('MAX(person_auth_log.created_at)'), 'created_at')
					.from('person_auth_log')
					.where({ type: 'password_reset', success: true })
				// An unknown address has no person, hence no password reset to restart its window.
				return 'personId' in key ? resets.where({ person_id: key.personId }) : resets.where(new Literal('false'))
			})
			.with('window_start', it =>
				it
					.select(
						new Literal(`
					GREATEST(
						COALESCE(last_successful_reset.created_at, NOW() - cfg.login_attempt_window),
						NOW() - cfg.login_attempt_window
					)`),
						'start_time',
					)
					.from('cfg')
					.from('last_successful_reset'))
			.with('failed_logins', it =>
				it
					.select(new Literal('COUNT(*)'), 'fails')
					.select(new Literal('MAX(person_auth_log.created_at)'), 'last_fail')
					.from('person_auth_log')
					.from('window_start')
					.where({
						type: 'login',
						success: false,
					})
					.where(
						'personId' in key
							? { person_id: key.personId }
							: where => where.isNull('person_id').compare('person_input_identifier', Operator.eq, key.normalizedEmail),
					)
					.where(new Literal('person_auth_log.created_at >= window_start.start_time')))
			.select(
				new Literal(`
				CASE WHEN failed_logins.fails = 0
				THEN 0
				ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (
					LEAST(
						failed_logins.last_fail + cfg.login_max_backoff,
						failed_logins.last_fail + cfg.login_base_backoff * (POWER(2, failed_logins.fails - 1))
					) - NOW()
				)))) END`),
				'retry_after_seconds',
			)
			.from('failed_logins')
			.from('cfg')

		const result = await qb.getResult(db)
		if (result.length === 0) {
			return 0
		}
		return Number(result[0].retry_after_seconds)
	}
}
