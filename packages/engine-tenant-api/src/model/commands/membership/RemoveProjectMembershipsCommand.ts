import { Command } from '../Command.js'
import { DeleteBuilder } from '@contember/database'

export class RemoveProjectMembershipCommand implements Command<void> {
	constructor(private readonly projectId: string, private readonly identityId: string, private readonly role: string) {}

	async execute({ db, bus, providers }: Command.Args): Promise<void> {
		await DeleteBuilder.create()
			.where({
				project_id: this.projectId,
				identity_id: this.identityId,
				role: this.role,
			})
			.from('project_membership')
			.execute(db)
	}
}
