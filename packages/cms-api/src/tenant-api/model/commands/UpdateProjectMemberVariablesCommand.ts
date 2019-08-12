import Command from './Command'
import { Client } from '@contember/database'
import { uuid } from '../../../utils/uuid'
import { InsertBuilder } from '@contember/database'
import { UpdateProjectMemberErrorCode } from '../../schema/types'
import RemoveProjectMemberVariablesCommand from './RemoveProjectMemberVariablesCommand'

class UpdateProjectMemberVariablesCommand
	implements Command<UpdateProjectMemberVariablesCommand.UpdateProjectMemberResponse> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly variables: readonly UpdateProjectMemberVariablesCommand.VariableUpdate[],
		private readonly deleteOld: boolean,
	) {}

	async execute(db: Client): Promise<UpdateProjectMemberVariablesCommand.UpdateProjectMemberResponse> {
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

		if (this.deleteOld) {
			await new RemoveProjectMemberVariablesCommand(this.projectId, this.identityId, this.variables).execute(db)
		}

		return new UpdateProjectMemberVariablesCommand.UpdateProjectMemberResponseOk()
	}
}

namespace UpdateProjectMemberVariablesCommand {
	export type VariableUpdate = {
		name: string
		values: ReadonlyArray<string>
	}

	export type UpdateProjectMemberResponse = UpdateProjectMemberResponseOk | UpdateProjectMemberResponseError

	export class UpdateProjectMemberResponseOk {
		readonly ok = true

		constructor() {}
	}

	export class UpdateProjectMemberResponseError {
		readonly ok = false

		constructor(public readonly errors: Array<UpdateProjectMemberErrorCode>) {}
	}
}

export default UpdateProjectMemberVariablesCommand
