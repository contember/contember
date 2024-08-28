import { Command } from '../Command'
import { InsertBuilder } from '@contember/database'
import { plusMinutes } from '../../utils/time'
import { TokenHash } from '../../utils'
import { PersonTokenType } from '../../type'

export class SavePersonTokenCommand implements Command<void> {
	constructor(
		private readonly personId: string,
		private readonly tokenHash: TokenHash,
		private readonly type: PersonTokenType,
		private readonly expirationMinutes: number,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('person_token')
			.values({
				id: providers.uuid(),
				token_hash: this.tokenHash,
				person_id: this.personId,
				expires_at: plusMinutes(providers.now(), this.expirationMinutes),
				created_at: providers.now(),
				used_at: null,
				type: this.type,
			})
			.execute(db)
	}
}
