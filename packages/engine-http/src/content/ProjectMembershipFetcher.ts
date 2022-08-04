import { DatabaseContext, ProjectMemberManager } from '@contember/engine-tenant-api'
import { Acl } from '@contember/schema'

export class ProjectMembershipFetcher {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly databaseContext: DatabaseContext,
	) {
	}

	public async fetchMemberships(projectSlug: string, identity: { id: string; roles?: readonly string[] }): Promise<readonly Acl.Membership[]> {
		return await this.projectMemberManager.getEffectiveProjectMemberships(
			this.databaseContext,
			{ slug: projectSlug },
			identity,
		)
	}
}
