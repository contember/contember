import { Command } from '../Command'
import { ConflictActionType, DeleteBuilder, InsertBuilder } from '@contember/database'
import { ImplementationException } from '../../../exceptions'
import { MembershipInput } from './types'
import { PatchProjectMembershipVariablesCommand } from './variables/PatchProjectMembershipVariablesCommand'

export class CreateOrUpdateProjectMembershipCommand implements Command<void> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly membership: MembershipInput,
	) {}

	async execute({ db, bus, providers }: Command.Args): Promise<void> {
		const result = await InsertBuilder.create()
			.into('project_membership')
			.values({
				id: providers.uuid(),
				project_id: this.projectId,
				identity_id: this.identityId,
				role: this.membership.role,
			})
			// intentionally using update instead of "do nothing" so I can use "returning id"
			.onConflict(ConflictActionType.update, ['project_id', 'identity_id', 'role'], {
				role: this.membership.role,
			})
			.returning('id')
			.execute(db)
		if (result.length !== 1) {
			throw new ImplementationException()
		}
		const membershipId = result[0] as string
		const variables = await bus.execute(
			new PatchProjectMembershipVariablesCommand(membershipId, this.membership.variables),
		)
		if (Object.values(variables).find(it => it.length === 0)) {
			// todo soft-delete instead
			await DeleteBuilder.create()
				.where({
					id: membershipId,
				})
				.from('project_membership')
				.execute(db)
		}
	}
}
