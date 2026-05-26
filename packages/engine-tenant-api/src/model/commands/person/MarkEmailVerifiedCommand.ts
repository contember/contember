import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'
import { ImplementationException } from '../../../exceptions'

/**
 * Marks the person's current email as verified. When `email` is given the
 * address is swapped at the same time (email-change confirmation) — the new
 * address is verified by construction, since the token was delivered to it.
 */
export class MarkEmailVerifiedCommand implements Command<void> {
	constructor(
		private readonly personId: string,
		private readonly email?: string,
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const count = await UpdateBuilder.create()
			.table('person')
			.where({ id: this.personId })
			.values({
				email_verified_at: providers.now(),
				...(this.email !== undefined ? { email: this.email } : {}),
			})
			.execute(db)

		if (count === 0) {
			throw new ImplementationException()
		}
	}
}
