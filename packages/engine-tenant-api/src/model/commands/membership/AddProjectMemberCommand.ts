import { Command } from '../Command'
import { CreateOrUpdateProjectMembershipCommand } from './CreateOrUpdateProjectMembershipCommand'
import { Response, ResponseError, ResponseOk } from '../../utils/Response'
import { SelectBuilder } from '@contember/database'
import { MembershipInput } from './types'

type CommandResponse = Response<null, AddProjectMemberCommandError>

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
				'ALREADY_MEMBER',
				`This identity is already a project member. Use updateProjectMember mutation to change memberships.`,
			)
		}

		try {
			for (const membership of this.memberships) {
				await bus.execute(new CreateOrUpdateProjectMembershipCommand(this.projectId, this.identityId, membership))
			}
			return new ResponseOk(null)
		} catch (e) {
			if (!(e instanceof Error)) {
				throw e
			}
			switch ((e as any).constraint) {
				case 'project_membership_project':
					return new ResponseError('PROJECT_NOT_FOUND', 'Project not found')
				case 'project_membership_identity':
					return new ResponseError('IDENTITY_NOT_FOUND', 'Identity not found')
				default:
					throw e
			}
		}
	}
}

export type AddProjectMemberCommandError =
	| 'ALREADY_MEMBER'
	| 'PROJECT_NOT_FOUND'
	| 'IDENTITY_NOT_FOUND'
