import Command from './Command'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { uuid } from '../../../utils/uuid'
import InsertBuilder from '../../../core/knex/InsertBuilder'
import { UpdateProjectMemberVariablesErrorCode } from '../../schema/types'

class UpdateProjectMemberVariablesCommand
	implements Command<UpdateProjectMemberVariablesCommand.UpdateProjectMemberVariablesResponse> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly variables: ReadonlyArray<UpdateProjectMemberVariablesCommand.VariableUpdate>
	) {}

	async execute(db: KnexWrapper): Promise<UpdateProjectMemberVariablesCommand.UpdateProjectMemberVariablesResponse> {
		try {
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
			return new UpdateProjectMemberVariablesCommand.UpdateProjectMemberVariablesResponseOk()
		} catch (e) {
			switch (e.constraint) {
				case 'project_member_project_id_fkey':
					return new UpdateProjectMemberVariablesCommand.UpdateProjectMemberVariablesResponseError([
						UpdateProjectMemberVariablesErrorCode.PROJECT_NOT_FOUND,
					])

				case 'project_member_identity':
					return new UpdateProjectMemberVariablesCommand.UpdateProjectMemberVariablesResponseError([
						UpdateProjectMemberVariablesErrorCode.IDENTITY_NOT_FOUND,
					])

				default:
					throw e
			}
		}
	}
}

namespace UpdateProjectMemberVariablesCommand {
	export type VariableUpdate = {
		name: string
		values: ReadonlyArray<string>
	}

	export type UpdateProjectMemberVariablesResponse =
		| UpdateProjectMemberVariablesResponseOk
		| UpdateProjectMemberVariablesResponseError

	export class UpdateProjectMemberVariablesResponseOk {
		readonly ok = true

		constructor() {}
	}

	export class UpdateProjectMemberVariablesResponseError {
		readonly ok = false

		constructor(public readonly errors: Array<UpdateProjectMemberVariablesErrorCode>) {}
	}
}

export default UpdateProjectMemberVariablesCommand
