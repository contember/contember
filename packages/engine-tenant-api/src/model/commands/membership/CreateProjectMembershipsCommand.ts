import { Command } from '../'
import { UpdateProjectMembershipVariablesCommand } from './'
import { Membership } from '../../type/Membership'
import { InsertBuilder } from '@contember/database'
import { ImplementationException } from '../../../exceptions'

class CreateProjectMembershipsCommand implements Command<void> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly memberships: readonly Membership[],
	) {}

	async execute({ db, bus, providers }: Command.Args): Promise<void> {
		for (const membership of this.memberships) {
			const result = await db
				.insertBuilder()
				.into('project_membership')
				.values({
					id: providers.uuid(),
					project_id: this.projectId,
					identity_id: this.identityId,
					role: membership.role,
				})
				// intentionally using update instead of "do nothing" so I can use "returning id"
				.onConflict(InsertBuilder.ConflictActionType.update, ['project_id', 'identity_id', 'role'], {
					role: membership.role,
				})
				.returning('id')
				.execute()
			if (result.length !== 1) {
				throw new ImplementationException()
			}
			await bus.execute(new UpdateProjectMembershipVariablesCommand(result[0] as string, membership.variables, false))
		}
	}
}

export { CreateProjectMembershipsCommand }
