import { Command } from '../Command'
import { RemoveProjectMemberErrorCode } from '../../../schema'
import { DeleteBuilder } from '@contember/database'
import { Response, ResponseError, ResponseOk } from '../../utils/Response'

export class RemoveProjectMemberCommand implements Command<RemoveProjectMemberResponse> {
	constructor(private readonly projectId: string, private readonly identityId: string) {}

	async execute({ db, bus }: Command.Args): Promise<RemoveProjectMemberResponse> {
		const memberWhere = {
			project_id: this.projectId,
			identity_id: this.identityId,
		}
		const result = await DeleteBuilder.create() //
			.from('project_membership')
			.where(memberWhere)
			.execute(db)

		if (result === 0) {
			return new ResponseError(RemoveProjectMemberErrorCode.NotMember, 'Not a project member')
		}
		return new ResponseOk(null)
	}
}

export type RemoveProjectMemberResponse = Response<null, RemoveProjectMemberErrorCode>
