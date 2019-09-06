import { Command } from '../'

class RemoveProjectMembershipCommand implements Command<void> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly exceptRoles: readonly string[],
	) {}

	async execute({ db }: Command.Args): Promise<void> {
		await db
			.deleteBuilder()
			.where({
				identity_id: this.identityId,
				project_id: this.projectId,
			})
			.where(expr => expr.not(expr => expr.in('role', [...this.exceptRoles])))
			.from('project_membership')
			.execute()
	}
}

export { RemoveProjectMembershipCommand }
