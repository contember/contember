import { Command } from '../Command.js'
import { InsertBuilder } from '@contember/database'
import { plusMinutes } from '../../utils/time.js'
import { TokenHash } from '../../utils/index.js'

const PASSWORD_RESET_EXPIRATION = 60

export class SavePasswordResetRequestCommand implements Command<void> {
	constructor(
		private readonly personId: string,
		private readonly tokenHash: TokenHash,
		private readonly expirationMinutes: number = PASSWORD_RESET_EXPIRATION,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('person_password_reset')
			.values({
				id: providers.uuid(),
				token_hash: this.tokenHash,
				person_id: this.personId,
				expires_at: plusMinutes(providers.now(), this.expirationMinutes),
				created_at: providers.now(),
				used_at: null,
			})
			.execute(db)
	}
}
