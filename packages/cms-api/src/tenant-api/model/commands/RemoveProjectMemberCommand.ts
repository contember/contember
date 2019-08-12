import Command from './Command'
import { RemoveProjectMemberErrorCode } from '../../schema/types'
import { Client } from '@contember/database'
import RemoveProjectMemberVariablesCommand from './RemoveProjectMemberVariablesCommand'

class RemoveProjectMemberCommand implements Command<RemoveProjectMemberCommand.RemoveProjectMemberResponse> {
	constructor(private readonly projectId: string, private readonly identityId: string) {}

	async execute(db: Client): Promise<RemoveProjectMemberCommand.RemoveProjectMemberResponse> {
		const memberWhere = {
			project_id: this.projectId,
			identity_id: this.identityId,
		}
		const result = await db
			.selectBuilder()
			.where(memberWhere)
			.from('project_member')
			.select('id')
			.getResult()

		if (result.length === 0) {
			return new RemoveProjectMemberCommand.RemoveProjectMemberResponseError([RemoveProjectMemberErrorCode.NotMember])
		}
		await db
			.deleteBuilder()
			.from('project_member')
			.where(memberWhere)
			.execute()

		await new RemoveProjectMemberVariablesCommand(this.projectId, this.identityId, []).execute(db)

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

export default RemoveProjectMemberCommand
