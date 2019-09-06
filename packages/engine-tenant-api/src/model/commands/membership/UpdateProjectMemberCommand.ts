import { Command } from '../'
import { UpdateProjectMemberErrorCode } from '../../../schema'
import { Membership } from '../../type/Membership'
import { CreateProjectMembershipsCommand } from './CreateProjectMembershipsCommand'
import { RemoveProjectMembershipCommand } from './RemoveProjectMembershipCommand'

class UpdateProjectMemberCommand implements Command<UpdateProjectMemberCommand.UpdateProjectMemberResponse> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly memberships: readonly Membership[],
	) {}

	async execute({ db, bus, providers }: Command.Args): Promise<UpdateProjectMemberCommand.UpdateProjectMemberResponse> {
		const result = await db
			.selectBuilder()
			.select('id')
			.from('project_membership')
			.where({
				project_id: this.projectId,
				identity_id: this.identityId,
			})
			.getResult()
		if (result.length === 0) {
			return new UpdateProjectMemberCommand.UpdateProjectMemberResponseError([UpdateProjectMemberErrorCode.NotMember])
		}

		try {
			await bus.execute(new CreateProjectMembershipsCommand(this.projectId, this.identityId, this.memberships))
			await bus.execute(
				new RemoveProjectMembershipCommand(this.projectId, this.identityId, this.memberships.map(it => it.role)),
			)

			return new UpdateProjectMemberCommand.UpdateProjectMemberResponseOk()
		} catch (e) {
			switch (e.constraint) {
				case 'project_membership_project':
					return new UpdateProjectMemberCommand.UpdateProjectMemberResponseError([
						UpdateProjectMemberErrorCode.ProjectNotFound,
					])

				default:
					throw e
			}
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

export { UpdateProjectMemberCommand }
