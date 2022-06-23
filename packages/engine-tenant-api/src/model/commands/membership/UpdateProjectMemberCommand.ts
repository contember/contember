import { Command } from '../Command.js'
import { UpdateProjectMemberErrorCode } from '../../../schema/index.js'
import { CreateOrUpdateProjectMembershipCommand } from './CreateOrUpdateProjectMembershipCommand.js'
import { SelectBuilder } from '@contember/database'
import { MembershipUpdateInput } from './types.js'
import { RemoveProjectMembershipCommand } from './RemoveProjectMembershipsCommand.js'
import { Response, ResponseError, ResponseOk } from '../../utils/Response.js'

export class UpdateProjectMemberCommand implements Command<UpdateProjectMemberResponse> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly memberships: readonly MembershipUpdateInput[],
	) {}

	async execute({ db, bus, providers }: Command.Args): Promise<UpdateProjectMemberResponse> {
		const result = await SelectBuilder.create()
			.select('id')
			.from('project_membership')
			.where({
				project_id: this.projectId,
				identity_id: this.identityId,
			})
			.getResult(db)
		if (result.length === 0) {
			return new ResponseError(UpdateProjectMemberErrorCode.NotMember, 'Not a project member')
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

			return new ResponseOk(null)
		} catch (e) {
			if (!(e instanceof Error)) {
				throw e
			}
			switch ((e as any).constraint) {
				case 'project_membership_project':
					return new ResponseError(UpdateProjectMemberErrorCode.ProjectNotFound, 'Project not found')
				default:
					throw e
			}
		}
	}
}
export type UpdateProjectMemberResponse = Response<null, UpdateProjectMemberErrorCode>
