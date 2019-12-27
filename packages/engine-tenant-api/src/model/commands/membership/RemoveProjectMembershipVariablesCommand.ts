import { Command } from '../Command'
import { UpdateProjectMembershipVariablesCommand } from './UpdateProjectMembershipVariablesCommand'
import { DeleteBuilder } from '@contember/database'

class RemoveProjectMembershipVariablesCommand implements Command<void> {
	constructor(
		private readonly membershipId: string,
		private readonly except: readonly UpdateProjectMembershipVariablesCommand.VariableUpdate[],
	) {}

	async execute({ db }: Command.Args): Promise<void> {
		await DeleteBuilder.create()
			.where({
				membership_id: this.membershipId,
			})
			.where(expr =>
				expr.not(expr =>
					expr.in(
						'variable',
						this.except.map(it => it.name),
					),
				),
			)
			.from('project_membership_variable')
			.execute(db)
	}
}

export { RemoveProjectMembershipVariablesCommand }
