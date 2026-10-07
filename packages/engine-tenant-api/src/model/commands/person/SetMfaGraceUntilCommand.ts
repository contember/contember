import { Command } from '../Command.js'
import { Literal, UpdateBuilder } from '@contember/database'

/**
 * Opens the MFA enrollment grace window by anchoring `person.mfa_grace_until` to
 * `now() + graceSeconds` on the DATABASE clock, so the gate that reads it back
 * (`PersonRow.is_in_grace`, evaluated against `now()`) can't be weakened by
 * app/DB clock skew or skew between engine instances. See engine-tenant-api/CLAUDE.md.
 */
export class SetMfaGraceUntilCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly graceSeconds: number) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person')
			.where({ id: this.personId })
			.values({
				mfa_grace_until: new Literal('now() + make_interval(secs => ?)', [this.graceSeconds]),
			})
			.execute(db)
	}
}
