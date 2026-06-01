import { Command } from '../../Command.js'
import { ConflictActionType, InsertBuilder } from '@contember/database'

export class SetProjectMembershipVariableValuesCommand implements Command<void> {
	constructor(
		private readonly membershipId: string,
		private readonly name: string,
		private readonly values: ReadonlyArray<string>,
	) {}

	async execute({ db, providers, bus }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('project_membership_variable')
			.values({
				id: providers.uuid(),
				membership_id: this.membershipId,
				variable: this.name,
				value: JSON.stringify(this.values),
			})
			.onConflict(ConflictActionType.update, ['membership_id', 'variable'], {
				value: JSON.stringify(this.values),
			})
			.execute(db)
	}
}
