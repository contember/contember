import { Command, RemoveProjectMemberVariablesCommand } from './'
import { RemoveProjectMemberErrorCode } from '../../schema'
import { Client } from '@contember/database'

class RemoveProjectMemberCommand implements Command<RemoveProjectMemberCommand.RemoveProjectMemberResponse> {
	constructor(private readonly projectId: string, private readonly identityId: string) {}

	async execute({ db, bus }: Command.Args): Promise<RemoveProjectMemberCommand.RemoveProjectMemberResponse> {
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

		await bus.execute(new RemoveProjectMemberVariablesCommand(this.projectId, this.identityId, []))

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
