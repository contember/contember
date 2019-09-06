import { Command } from '../'
import { RemoveProjectMembershipVariablesCommand } from './'
import { InsertBuilder } from '@contember/database'

class UpdateProjectMembershipVariablesCommand implements Command<void> {
	constructor(
		private readonly membershipId: string,
		private readonly variables: readonly UpdateProjectMembershipVariablesCommand.VariableUpdate[],
		private readonly deleteOld: boolean,
	) {}

	async execute({ db, providers, bus }: Command.Args): Promise<void> {
		const queries = this.variables.map(update => {
			return db
				.insertBuilder()
				.into('project_membership_variable')
				.values({
					id: providers.uuid(),
					membership_id: this.membershipId,
					variable: update.name,
					value: JSON.stringify(update.values),
				})
				.onConflict(InsertBuilder.ConflictActionType.update, ['membership_id', 'variable'], {
					value: JSON.stringify(update.values),
				})
				.execute()
		})
		await Promise.all(queries)

		if (this.deleteOld) {
			await bus.execute(new RemoveProjectMembershipVariablesCommand(this.membershipId, this.variables))
		}
	}
}

namespace UpdateProjectMembershipVariablesCommand {
	export type VariableUpdate = {
		name: string
		values: ReadonlyArray<string>
	}
}

export { UpdateProjectMembershipVariablesCommand }
