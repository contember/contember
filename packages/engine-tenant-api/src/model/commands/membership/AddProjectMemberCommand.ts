import { Command } from '../Command'
import { CreateOrUpdateProjectMembershipCommand } from './CreateOrUpdateProjectMembershipCommand'
import { Response, ResponseError, ResponseOk } from '../../utils/Response'
import { SelectBuilder } from '@contember/database'
import { MembershipInput } from './types'

type CommandResponse = Response<undefined, AddProjectMemberCommandError>

export class AddProjectMemberCommand implements Command<CommandResponse> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly memberships: readonly MembershipInput[],
	) {}

	async execute({ db, providers, bus }: Command.Args): Promise<CommandResponse> {
		const result = await SelectBuilder.create()
			.select('id')
			.from('project_membership')
			.where({
				project_id: this.projectId,
				identity_id: this.identityId,
			})
			.getResult(db)
		if (result.length > 0) {
			return new ResponseError(
				AddProjectMemberCommandError.alreadyMember,
				`This identity is already a project member. Use updateProjectMember mutation to change memberships.`,
			)
		}

		try {
			for (const membership of this.memberships) {
				await bus.execute(new CreateOrUpdateProjectMembershipCommand(this.projectId, this.identityId, membership))
			}
			return new ResponseOk(undefined)
		} catch (e) {
			switch (e.constraint) {
				case 'project_membership_project':
					return new ResponseError(AddProjectMemberCommandError.projectNotFound, 'Project not found')
				case 'project_membership_identity':
					return new ResponseError(AddProjectMemberCommandError.identityNotfound, 'Identity not found')
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
