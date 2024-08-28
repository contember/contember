import { Command } from '../Command'
import { ChangePasswordCommand } from '../person/ChangePasswordCommand'
import { Response, ResponseOk } from '../../utils/Response'
import { PersonTokenQuery } from '../../queries/personToken/PersonTokenQuery'
import { InvalidateTokenCommand } from './InvalidateTokenCommand'
import { validateToken } from '../../utils'
import { PersonToken } from '../../type'

export class ResetPasswordCommand implements Command<ResetPasswordCommandResponse> {
	constructor(private readonly token: string, private readonly password: string) {}

	async execute({ db, providers, bus }: Command.Args): Promise<ResetPasswordCommandResponse> {
		const now = providers.now()
		const token = await db.createQueryHandler().fetch(PersonTokenQuery.byToken(this.token, 'password_reset'))
		const tokenValidationResult = validateToken({ entry: token, token: this.token, now, validationType: 'token' })
		if (!tokenValidationResult.ok) {
			return tokenValidationResult
		}
		await bus.execute(new InvalidateTokenCommand(tokenValidationResult.result.id))
		await bus.execute(new ChangePasswordCommand(tokenValidationResult.result.person_id, this.password))

		return new ResponseOk(null)
	}
}
export type ResetPasswordCommandErrorCode =
	| PersonToken.TokenValidationError

export type ResetPasswordCommandResponse = Response<null, PersonToken.TokenValidationError>
