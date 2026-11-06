import { Command } from '../Command.js'
import { RemoveProjectMemberErrorCode } from '../../../schema/index.js'
import { DeleteBuilder } from '@contember/database'
import { Response, ResponseError, ResponseOk } from '../../utils/Response.js'

export class RemoveProjectMemberCommand implements Command<RemoveProjectMemberResponse> {
	/** @param roles only memberships with these roles are removed */
	constructor(private readonly projectId: string, private readonly identityId: string, private readonly roles: readonly string[]) {}

	async execute({ db, bus }: Command.Args): Promise<RemoveProjectMemberResponse> {
		const memberWhere = {
			project_id: this.projectId,
			identity_id: this.identityId,
		}
		const roles = this.roles
		const result = await DeleteBuilder.create() //
			.from('project_membership')
			.where(memberWhere)
			.where(where => where.in('role', roles))
			.execute(db)

		if (result === 0) {
			return new ResponseError('NOT_MEMBER', 'Not a project member')
		}
		return new ResponseOk(null)
	}
}

export type RemoveProjectMemberResponse = Response<null, RemoveProjectMemberErrorCode>
