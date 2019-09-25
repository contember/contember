import { Command } from '../Command'
import { UpdateProjectMembershipVariablesCommand } from './UpdateProjectMembershipVariablesCommand'

class RemoveProjectMembershipVariablesCommand implements Command<void> {
	constructor(
		private readonly membershipId: string,
		private readonly except: readonly UpdateProjectMembershipVariablesCommand.VariableUpdate[],
	) {}

	async execute({ db }: Command.Args): Promise<void> {
		await db
			.deleteBuilder()
			.where({
				membership_id: this.membershipId,
			})
			.where(expr => expr.not(expr => expr.in('variable', this.except.map(it => it.name))))
			.from('project_membership_variable')
			.execute()
	}
}

export { RemoveProjectMembershipVariablesCommand }
