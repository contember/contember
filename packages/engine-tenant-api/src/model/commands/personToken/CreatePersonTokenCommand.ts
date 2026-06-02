import { Command } from '../Command.js'
import { computeTokenHash, generateToken } from '../../utils/index.js'
import { SavePersonTokenCommand } from './SavePersonTokenCommand.js'
import { PersonToken } from '../../type/index.js'
import { JSONValue } from '@contember/schema'
import {
	EMAIL_CHANGE_EXPIRATION_MINUTES,
	EMAIL_VERIFICATION_EXPIRATION_MINUTES,
	PASSWORD_RESET_EXPIRATION_MINUTES,
} from '../../consts/expirations.js'

export class CreatePersonTokenCommand implements Command<CreatePersonTokenCommand.Result> {
	private constructor(
		private readonly personId: string,
		private readonly type: PersonToken.Type,
		private readonly expirationMinutes: number,
		private readonly meta: JSONValue | null = null,
	) {}

	static createPasswordResetRequest(personId: string, expirationMinutes: number = PASSWORD_RESET_EXPIRATION_MINUTES): CreatePersonTokenCommand {
		return new CreatePersonTokenCommand(personId, 'password_reset', expirationMinutes)
	}

	static createPasswordlessRequest(personId: string, expirationMinutes: number): CreatePersonTokenCommand {
		return new CreatePersonTokenCommand(personId, 'passwordless', expirationMinutes)
	}

	static createEmailVerificationRequest(
		personId: string,
		email: string,
		expirationMinutes: number = EMAIL_VERIFICATION_EXPIRATION_MINUTES,
	): CreatePersonTokenCommand {
		// Bind the token to the address it was issued for, so it can only verify
		// that exact e-mail — not whatever the person's current address happens to
		// be when the link is finally clicked (see EmailVerificationManager.verifyEmail).
		return new CreatePersonTokenCommand(personId, 'email_verification', expirationMinutes, { email })
	}

	static createEmailChangeRequest(
		personId: string,
		newEmail: string,
		expirationMinutes: number = EMAIL_CHANGE_EXPIRATION_MINUTES,
	): CreatePersonTokenCommand {
		return new CreatePersonTokenCommand(personId, 'email_change', expirationMinutes, { email: newEmail })
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
				this.meta,
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
