import { Command } from '../Command'
import { InsertBuilder } from '@contember/database'
import { computeTokenHash, generateToken } from '../../utils'
import { plusMinutes } from '../../utils/time'

const PASSWORD_RESET_EXPIRATION = 60

class CreatePasswordResetRequestCommand implements Command<CreatePasswordResetRequestCommand.Result> {
	constructor(private readonly personId: string) {}

	async execute({ db, providers }: Command.Args): Promise<CreatePasswordResetRequestCommand.Result> {
		const token = await generateToken(providers)
		const tokenHash = computeTokenHash(token)

		await InsertBuilder.create()
			.into('person_password_reset')
			.values({
				id: providers.uuid(),
				token_hash: tokenHash,
				person_id: this.personId,
				expires_at: plusMinutes(providers.now(), PASSWORD_RESET_EXPIRATION),
				created_at: providers.now(),
				used_at: null,
			})
			.execute(db)

		return new CreatePasswordResetRequestCommand.Result(token)
	}
}

namespace CreatePasswordResetRequestCommand {
	export class Result {
		constructor(public readonly token: string) {}
	}
}

export { CreatePasswordResetRequestCommand }
