import { Command } from '../Command.js'
import { InsertBuilder } from '@contember/database'
import { plusMinutes } from '../../utils/time.js'
import { TokenHash } from '../../utils/index.js'
import { PersonToken } from '../../type/index.js'

class SavePersonTokenCommand implements Command<SavePersonTokenCommand.Result> {
	constructor(
		private readonly personId: string,
		private readonly tokenHash: TokenHash,
		private readonly type: PersonToken.Type,
		private readonly expirationMinutes: number,
	) {}

	async execute({ db, providers }: Command.Args): Promise<SavePersonTokenCommand.Result> {
		const id = providers.uuid()
		const expiresAt = plusMinutes(providers.now(), this.expirationMinutes)
		await InsertBuilder.create()
			.into('person_token')
			.values({
				id: id,
				token_hash: this.tokenHash,
				person_id: this.personId,
				expires_at: expiresAt,
				created_at: providers.now(),
				used_at: null,
				type: this.type,
			})
			.execute(db)

		return { id, expiresAt }
	}
}

namespace SavePersonTokenCommand {
	export interface Result {
		id: string
		expiresAt: Date
	}
}

export { SavePersonTokenCommand }
