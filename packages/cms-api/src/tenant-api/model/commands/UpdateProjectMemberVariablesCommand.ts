import Command from './Command'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { uuid } from '../../../utils/uuid'
import InsertBuilder from '../../../core/knex/InsertBuilder'

class UpdateProjectMemberVariablesCommand implements Command<void> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly variables: ReadonlyArray<UpdateProjectMemberVariablesCommand.VariableUpdate>
	) {}

	async execute(db: KnexWrapper): Promise<void> {
		const queries = this.variables.map(update => {
			return db
				.insertBuilder()
				.into('project_member_variable')
				.values({
					id: uuid(),
					project_id: this.projectId,
					identity_id: this.identityId,
					variable: update.name,
					values: [...update.values],
				})
				.onConflict(InsertBuilder.ConflictActionType.update, ['project_id', 'identity_id', 'variable'], {
					values: [...update.values],
				})
				.execute()
		})
		await Promise.all(queries)
	}
}

namespace UpdateProjectMemberVariablesCommand {
	export type VariableUpdate = {
		name: string
		values: ReadonlyArray<string>
	}
}

export default UpdateProjectMemberVariablesCommand
