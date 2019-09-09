import { Command } from '../Command'
import { Membership } from '../../type/Membership'
import { CreateOrUpdateProjectMembershipsCommand } from './CreateOrUpdateProjectMembershipsCommand'
import { Response, ResponseError, ResponseOk } from '../../utils/Response'

type CommandResponse = Response<undefined, AddProjectMemberCommandError>

export class AddProjectMemberCommand implements Command<CommandResponse> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly memberships: readonly Membership[],
	) {}

	async execute({ db, providers, bus }: Command.Args): Promise<CommandResponse> {
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
			return new ResponseError(AddProjectMemberCommandError.alreadyMember)
		}

		try {
			await bus.execute(
				new CreateOrUpdateProjectMembershipsCommand(this.projectId, this.identityId, this.memberships, false),
			)
			return new ResponseOk(undefined)
		} catch (e) {
			switch (e.constraint) {
				case 'project_membership_project':
					return new ResponseError(AddProjectMemberCommandError.projectNotFound)
				case 'project_membership_identity':
					return new ResponseError(AddProjectMemberCommandError.identityNotfound)
				default:
					throw e
			}
		}
	}
}

export enum AddProjectMemberCommandError {
	alreadyMember,
	projectNotFound,
	identityNotfound,
}
