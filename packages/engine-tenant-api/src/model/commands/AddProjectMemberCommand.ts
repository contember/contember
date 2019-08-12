import { Command } from './Command'
import { AddProjectMemberErrorCode } from '../../schema'
import { Client } from '@contember/database'
import { uuid } from '../../utils/uuid'
import { UpdateProjectMemberVariablesCommand } from '../'

class AddProjectMemberCommand implements Command<AddProjectMemberCommand.AddProjectMemberResponse> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly roles: readonly string[],
		private readonly variables: readonly UpdateProjectMemberVariablesCommand.VariableUpdate[],
	) {}

	async execute(db: Client): Promise<AddProjectMemberCommand.AddProjectMemberResponse> {
		try {
			await db
				.insertBuilder()
				.into('project_member')
				.values({
					id: uuid(),
					project_id: this.projectId,
					identity_id: this.identityId,
					roles: JSON.stringify(this.roles),
				})
				.execute()
			await new UpdateProjectMemberVariablesCommand(this.projectId, this.identityId, this.variables, false).execute(db)

			return new AddProjectMemberCommand.AddProjectMemberResponseOk()
		} catch (e) {
			switch (e.constraint) {
				case 'project_member_project_id_fkey':
					return new AddProjectMemberCommand.AddProjectMemberResponseError([AddProjectMemberErrorCode.ProjectNotFound])

				case 'project_member_identity':
					return new AddProjectMemberCommand.AddProjectMemberResponseError([AddProjectMemberErrorCode.IdentityNotFound])

				case 'project_member_project_identity':
					return new AddProjectMemberCommand.AddProjectMemberResponseError([AddProjectMemberErrorCode.AlreadyMember])

				default:
					throw e
			}
		}
	}
}

namespace AddProjectMemberCommand {
	export type AddProjectMemberResponse = AddProjectMemberResponseOk | AddProjectMemberResponseError

	export class AddProjectMemberResponseOk {
		readonly ok = true

		constructor() {}
	}

	export class AddProjectMemberResponseError {
		readonly ok = false

		constructor(public readonly errors: Array<AddProjectMemberErrorCode>) {}
	}
}

export { AddProjectMemberCommand }
