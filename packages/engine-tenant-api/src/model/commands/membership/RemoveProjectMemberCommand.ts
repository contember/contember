import { Command } from '../'
import { RemoveProjectMemberErrorCode } from '../../../schema'

class RemoveProjectMemberCommand implements Command<RemoveProjectMemberCommand.RemoveProjectMemberResponse> {
	constructor(private readonly projectId: string, private readonly identityId: string) {}

	async execute({ db, bus }: Command.Args): Promise<RemoveProjectMemberCommand.RemoveProjectMemberResponse> {
		const memberWhere = {
			project_id: this.projectId,
			identity_id: this.identityId,
		}
		const result = await db
			.deleteBuilder()
			.from('project_membership')
			.where(memberWhere)
			.execute()

		if (result === 0) {
			return new RemoveProjectMemberCommand.RemoveProjectMemberResponseError([RemoveProjectMemberErrorCode.NotMember])
		}

		return new RemoveProjectMemberCommand.RemoveProjectMemberResponseOk()
	}
}

namespace RemoveProjectMemberCommand {
	export type RemoveProjectMemberResponse = RemoveProjectMemberResponseOk | RemoveProjectMemberResponseError

	export class RemoveProjectMemberResponseOk {
		readonly ok = true

		constructor() {}
	}

	export class RemoveProjectMemberResponseError {
		readonly ok = false

		constructor(public readonly errors: Array<RemoveProjectMemberErrorCode>) {}
	}
}

export { RemoveProjectMemberCommand }
