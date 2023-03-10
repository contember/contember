import { Command } from '@contember/engine-system-api'
import { ConflictActionType, InsertBuilder, Literal } from '@contember/database'

export class SetVariableCommand implements Command<void> {

	constructor(
		private readonly name: string,
		private readonly value: string,
	) {
	}

	async execute({ providers, db }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('actions_variable')
			.values({
				id: providers.uuid(),
				name: this.name,
				value: this.value,
			})
			.onConflict(ConflictActionType.update, ['name'], {
				value: this.value,
				updated_at: new Literal('NOW()'),
			})
			.execute(db)
	}
}
