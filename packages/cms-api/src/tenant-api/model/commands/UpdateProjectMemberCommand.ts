import Command from './Command'
import { Client } from '@contember/database'
import { UpdateProjectMemberErrorCode } from '../../schema/types'
import UpdateProjectMemberVariablesCommand from './UpdateProjectMemberVariablesCommand'

class UpdateProjectMemberCommand implements Command<UpdateProjectMemberCommand.UpdateProjectMemberResponse> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly roles?: readonly string[],
		private readonly variables?: readonly UpdateProjectMemberVariablesCommand.VariableUpdate[],
	) {}

	async execute(db: Client): Promise<UpdateProjectMemberCommand.UpdateProjectMemberResponse> {
		const memberWhere = {
			project_id: this.projectId,
			identity_id: this.identityId,
		}
		const result = await db
			.selectBuilder()
			.where(memberWhere)
			.from('project_member')
			.select('id')
			.getResult()

		if (result.length === 0) {
			return new UpdateProjectMemberCommand.UpdateProjectMemberResponseError([UpdateProjectMemberErrorCode.NotMember])
		}

		if (this.roles) {
			await db
				.updateBuilder()
				.table('project_member')
				.values({
					roles: JSON.stringify(this.roles),
				})
				.where(memberWhere)
				.execute()
		}

		if (this.variables) {
			await new UpdateProjectMemberVariablesCommand(this.projectId, this.identityId, this.variables, true).execute(db)
		}

		return new UpdateProjectMemberCommand.UpdateProjectMemberResponseOk()
	}
}

namespace UpdateProjectMemberCommand {
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

export default UpdateProjectMemberCommand
