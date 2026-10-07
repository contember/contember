import { Command } from '../Command.js'
import { InsertBuilder, Literal } from '@contember/database'
import { TokenHash } from '../../utils/index.js'
import { PersonToken } from '../../type/index.js'
import { JSONValue } from '@contember/schema'
import { ImplementationException } from '../../../exceptions.js'

class SavePersonTokenCommand implements Command<SavePersonTokenCommand.Result> {
	constructor(
		private readonly personId: string,
		private readonly tokenHash: TokenHash,
		private readonly type: PersonToken.Type,
		private readonly expirationMinutes: number,
		private readonly meta: JSONValue | null = null,
	) {}

	async execute({ db, providers }: Command.Args): Promise<SavePersonTokenCommand.Result> {
		const id = providers.uuid()
		const result = await InsertBuilder.create()
			.into('person_token')
			.values({
				id: id,
				token_hash: this.tokenHash,
				// expires_at is computed on the DATABASE clock so the expiry gate
				// (PersonTokenQuery's `is_expired`, evaluated against NOW()) can never be
				// weakened by app/DB clock skew. created_at stays on the app clock — it is
				// display/ordering only, never compared. See engine-tenant-api/CLAUDE.md.
				person_id: this.personId,
				expires_at: new Literal('now() + make_interval(secs => ?)', [this.expirationMinutes * 60]),
				created_at: providers.now(),
				used_at: null,
				type: this.type,
				meta: this.meta,
			})
			.returning<{ expires_at: Date }>('expires_at')
			.execute(db)
		if (result.length !== 1) {
			throw new ImplementationException()
		}
		return { id, expiresAt: result[0].expires_at }
	}
}

namespace SavePersonTokenCommand {
	export interface Result {
		id: string
		expiresAt: Date
	}
}

export { SavePersonTokenCommand }
