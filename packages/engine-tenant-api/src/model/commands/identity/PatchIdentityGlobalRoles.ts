import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'

export class PatchIdentityGlobalRoles implements Command<boolean> {
	constructor(
		private readonly id: string,
		private readonly add: readonly string[],
		private readonly remove: readonly string[],
	) {
	}

	public async execute({ db, providers }: Command.Args): Promise<boolean> {
		const result = await UpdateBuilder.create()
			.table('identity')
			.where({
				id: this.id,
			})
			.values({
				roles: it => it.raw(`(
						SELECT JSONB_AGG(DISTINCT out_role)
						FROM JSONB_ARRAY_ELEMENTS_TEXT(roles || ?::jsonb) t(out_role)
						WHERE NOT(out_role = ANY (?::text[]))
					)`, JSON.stringify(this.add), this.remove),
			})
			.execute(db)
		return result > 0
	}
}
