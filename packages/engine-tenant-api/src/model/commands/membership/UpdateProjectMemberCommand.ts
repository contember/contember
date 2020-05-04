import { Command } from '../Command'
import { UpdateProjectMemberErrorCode } from '../../../schema'
import { CreateOrUpdateProjectMembershipCommand } from './CreateOrUpdateProjectMembershipCommand'
import { SelectBuilder } from '@contember/database'
import { MembershipUpdateInput } from './types'
import { RemoveProjectMembershipCommand } from './RemoveProjectMembershipsCommand'

class UpdateProjectMemberCommand implements Command<UpdateProjectMemberCommand.UpdateProjectMemberResponse> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly memberships: readonly MembershipUpdateInput[],
	) {}

	async execute({ db, bus, providers }: Command.Args): Promise<UpdateProjectMemberCommand.UpdateProjectMemberResponse> {
		const result = await SelectBuilder.create()
			.select('id')
			.from('project_membership')
			.where({
				project_id: this.projectId,
				identity_id: this.identityId,
			})
			.getResult(db)
		if (result.length === 0) {
			return new UpdateProjectMemberCommand.UpdateProjectMemberResponseError([UpdateProjectMemberErrorCode.NotMember])
		}

		try {
			for (const membershipUpdate of this.memberships) {
				if (membershipUpdate.operation === 'remove') {
					await bus.execute(new RemoveProjectMembershipCommand(this.projectId, this.identityId, membershipUpdate.role))
				} else {
					await bus.execute(
						new CreateOrUpdateProjectMembershipCommand(this.projectId, this.identityId, membershipUpdate),
					)
				}
			}

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
