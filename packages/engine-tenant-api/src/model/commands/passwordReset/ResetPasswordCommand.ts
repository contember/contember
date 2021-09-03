import { Command } from '../Command'
import { SelectBuilder, UpdateBuilder } from '@contember/database'
import { computeTokenHash } from '../../utils'
import { ImplementationException } from '../../../exceptions'
import { ChangePasswordCommand } from '../person/ChangePasswordCommand'
import { Response, ResponseError, ResponseOk } from '../../utils/Response'

export class ResetPasswordCommand implements Command<ResetPasswordCommandResponse> {
	constructor(private readonly token: string, private readonly password: string) {}

	async execute({ db, providers, bus }: Command.Args): Promise<ResetPasswordCommandResponse> {
		const tokenHash = computeTokenHash(this.token)

		const result =
			(
				await SelectBuilder.create<{ used_at: null | Date; expires_at: Date; id: string; person_id: string }>()
					.from('person_password_reset')
					.select('id')
					.select('person_id')
					.select('used_at')
					.select('expires_at')
					.where({ token_hash: tokenHash })
					.getResult(db)
			)[0] || null
		if (!result) {
			return new ResponseError(ResetPasswordCommandErrorCode.TOKEN_NOT_FOUND, 'Token was not found')
		}
		if (result.used_at) {
			return new ResponseError(
				ResetPasswordCommandErrorCode.TOKEN_USED,
				`Token was used at ${result.used_at.toISOString()}`,
			)
		}
		const now = providers.now()
		if (result.expires_at < now) {
			return new ResponseError(
				ResetPasswordCommandErrorCode.TOKEN_EXPIRED,
				`Token expired at ${result.expires_at.toISOString()}`,
			)
		}
		const count = await UpdateBuilder.create()
			.table('person_password_reset')
			.where({ id: result.id })
			.where(expr => expr.isNull('used_at'))
			.values({
				used_at: now,
			})
			.execute(db)
		if (count === 0) {
			throw new ImplementationException()
		}

		await bus.execute(new ChangePasswordCommand(result.person_id, this.password))

		return new ResponseOk(undefined)
	}
}
export enum ResetPasswordCommandErrorCode {
	TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
	TOKEN_USED = 'TOKEN_USED',
	TOKEN_EXPIRED = 'TOKEN_EXPIRED',
}

export type ResetPasswordCommandResponse = Response<undefined, ResetPasswordCommandErrorCode>
