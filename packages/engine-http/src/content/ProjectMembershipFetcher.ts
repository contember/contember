import { DatabaseContext, Membership, ProjectMemberManager } from '@contember/engine-tenant-api'

export class ProjectMembershipFetcher {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly databaseContext: DatabaseContext,
	) {
	}

	public async fetchMemberships(projectSlug: string, identity: { id: string; roles?: readonly string[] }): Promise<readonly Membership[]> {
		return await this.projectMemberManager.getProjectMemberships(
			this.databaseContext,
			{ slug: projectSlug },
			identity,
			undefined,
		)
	}
}
