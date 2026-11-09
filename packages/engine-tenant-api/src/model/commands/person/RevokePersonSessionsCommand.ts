import { Literal, Operator, SelectBuilder, UpdateBuilder } from '@contember/database'
import { Command } from '../Command.js'
import { ApiKey } from '../../type/index.js'

/**
 * Disables the person's sessions, except the one in `keepApiKeyId`, and marks its unused tokens
 * (password reset, passwordless, e-mail verification and change) as used.
 */
export class RevokePersonSessionsCommand implements Command<void> {
	constructor(
		private readonly personId: string,
		private readonly keepApiKeyId: string | null = null,
	) {}

	async execute({ db }: Command.Args): Promise<void> {
		const keepApiKeyId = this.keepApiKeyId
		await UpdateBuilder.create()
			.table('api_key')
			.values({ disabled_at: new Literal('now()') })
			.where(expr =>
				expr.in(
					'identity_id',
					SelectBuilder.create().select('identity_id').from('person').where({ id: this.personId }),
				)
			)
			.where({ type: ApiKey.Type.SESSION })
			.where(expr => expr.isNull('disabled_at'))
			.where(expr => keepApiKeyId !== null ? expr.compare('id', Operator.notEq, keepApiKeyId) : expr)
			.execute(db)

		await UpdateBuilder.create()
			.table('person_token')
			.values({ used_at: new Literal('now()') })
			.where({ person_id: this.personId })
			.where(expr => expr.isNull('used_at'))
			.execute(db)
	}
}
