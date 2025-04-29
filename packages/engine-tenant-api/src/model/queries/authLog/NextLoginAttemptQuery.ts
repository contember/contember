import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'

export class NextLoginAttemptQuery extends DatabaseQuery<Date> {

	constructor(
		private readonly email: string,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<Date> {
		const qb = SelectBuilder.create()
			.with('cfg', it => it.from('config'))
			.with('last_successful_reset', it => it
				.select(new Literal('MAX(person_auth_log.created_at)'), 'created_at')
				.from('person_auth_log')
				.join('person', 'person', it => it.columnsEq(['person', 'id'], ['person_auth_log', 'person_id']))
				.where({
					type: 'password_reset',
					success: true,
					email: this.email,
				}),
			)
			.with('window_start', it => it
				.select(new Literal(`
					GREATEST(
						COALESCE(last_successful_reset.created_at, NOW() - cfg.login_attempt_window), 
						NOW() - cfg.login_attempt_window
					)`), 'start_time')
				.from('cfg')
				.from('last_successful_reset'),
			)
			.with('failed_logins', it => it
				.select(new Literal('COUNT(*)'), 'fails')
				.select(new Literal('MAX(person_auth_log.created_at)'), 'last_fail')
				.from('person_auth_log')
				.from('window_start')
				.where({
					person_input_identifier: this.email,
					type: 'login',
					success: false,
				})
				.where(new Literal('person_auth_log.created_at >= window_start.start_time')),
			)
			.select(new Literal(`
				CASE WHEN failed_logins.fails = 0 
				THEN NOW() 
				ELSE LEAST(
					failed_logins.last_fail + cfg.login_max_backoff, 
					failed_logins.last_fail + cfg.login_base_backoff * (POWER(2, failed_logins.fails - 1))
				) END`), 'next_allowed_login')
			.from('failed_logins')
			.from('cfg')

		const result = await qb.getResult(db)
		if (result.length === 0) {
			return new Date()
		}
		return result[0].next_allowed_login
	}


}
