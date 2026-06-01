import { Command } from '../Command.js'
import { computeTokenHash, generateToken } from '../../utils/index.js'
import { SavePersonTokenCommand } from './SavePersonTokenCommand.js'
import { PersonToken } from '../../type/index.js'
import { PASSWORD_RESET_EXPIRATION_MINUTES } from '../../consts/expirations.js'

export class CreatePersonTokenCommand implements Command<CreatePersonTokenCommand.Result> {
	private constructor(
		private readonly personId: string,
		private readonly type: PersonToken.Type,
		private readonly expirationMinutes: number,
	) {}

	static createPasswordResetRequest(personId: string, expirationMinutes: number = PASSWORD_RESET_EXPIRATION_MINUTES): CreatePersonTokenCommand {
		return new CreatePersonTokenCommand(personId, 'password_reset', expirationMinutes)
	}

	static createPasswordlessRequest(personId: string, expirationMinutes: number): CreatePersonTokenCommand {
		return new CreatePersonTokenCommand(personId, 'passwordless', expirationMinutes)
	}

	async execute({ db, providers, bus }: Command.Args): Promise<CreatePersonTokenCommand.Result> {
		const token = await generateToken(providers)
		const tokenHash = computeTokenHash(token)
		const result = await bus.execute(
			new SavePersonTokenCommand(
				this.personId,
				tokenHash,
				this.type,
				this.expirationMinutes,
			),
		)

		return { ...result, token }
	}
}

namespace CreatePersonTokenCommand {
	export interface Result {
		readonly id: string
		readonly token: string
		readonly expiresAt: Date
	}
}
