import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'
import { ImplementationException } from '../../../exceptions'

export class InvalidateTokenCommand implements Command<void> {
	constructor(private readonly id: string) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const count = await UpdateBuilder.create()
			.table('person_token')
			.where({ id: this.id })
			.where(expr => expr.isNull('used_at'))
			.values({
				used_at: providers.now(),
			})
			.execute(db)

		if (count === 0) {
			throw new ImplementationException()
		}
	}
}
