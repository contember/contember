import { Command } from '../Command'
import { AddProjectMemberErrorCode } from '../../../schema'
import { Membership } from '../../type/Membership'
import { CreateProjectMembershipsCommand } from './CreateProjectMembershipsCommand'

class AddProjectMemberCommand implements Command<AddProjectMemberCommand.AddProjectMemberResponse> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly memberships: readonly Membership[],
	) {}

	async execute({ db, providers, bus }: Command.Args): Promise<AddProjectMemberCommand.AddProjectMemberResponse> {
		const result = await db
			.selectBuilder()
			.select('id')
			.from('project_membership')
			.where({
				project_id: this.projectId,
				identity_id: this.identityId,
			})
			.getResult()
		if (result.length > 0) {
			return new AddProjectMemberCommand.AddProjectMemberResponseError([AddProjectMemberErrorCode.AlreadyMember])
		}

		try {
			await bus.execute(new CreateProjectMembershipsCommand(this.projectId, this.identityId, this.memberships))

			return new AddProjectMemberCommand.AddProjectMemberResponseOk()
		} catch (e) {
			switch (e.constraint) {
				case 'project_membership_project':
					return new AddProjectMemberCommand.AddProjectMemberResponseError([AddProjectMemberErrorCode.ProjectNotFound])

				case 'project_membership_identity':
					return new AddProjectMemberCommand.AddProjectMemberResponseError([AddProjectMemberErrorCode.IdentityNotFound])

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
