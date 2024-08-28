import { Command } from '../Command'
import { computeTokenHash, generateToken } from '../../utils'
import { SavePersonTokenCommand } from './SavePersonTokenCommand'
import { PersonTokenType } from '../../type'
import { PASSWORD_RESET_EXPIRATION_MINUTES } from '../../consts/expirations'

export class CreatePersonTokenCommand implements Command<CreatePasswordResetRequestResult> {
	private constructor(
		private readonly personId: string,
		private readonly type: PersonTokenType,
		private readonly expirationMinutes: number,
	) {}

	static createPasswordResetRequest(personId: string, expirationMinutes: number = PASSWORD_RESET_EXPIRATION_MINUTES): CreatePersonTokenCommand {
		return new CreatePersonTokenCommand(personId, 'password_reset', expirationMinutes)
	}

	async execute({ db, providers, bus }: Command.Args): Promise<CreatePasswordResetRequestResult> {
		const token = await generateToken(providers)
		const tokenHash = computeTokenHash(token)
		await bus.execute(new SavePersonTokenCommand(
			this.personId,
			tokenHash,
			this.type,
			this.expirationMinutes,
		))

		return new CreatePasswordResetRequestResult(token)
	}
}
export class CreatePasswordResetRequestResult {
	constructor(public readonly token: string) {}
}
