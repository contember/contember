import { DatabaseContext, ProjectMemberManager, WorkloadAssumeRule, WorkloadIdentityManager } from '@contember/engine-tenant-api'
import { Acl } from '@contember/schema'

export class ProjectMembershipFetcher {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly workloadIdentityManager: WorkloadIdentityManager,
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

	public async fetchWorkloadAssumeRules(projectSlug: string, trustId: string): Promise<readonly WorkloadAssumeRule[]> {
		return await this.workloadIdentityManager.getAssumeRules(this.databaseContext, trustId, projectSlug)
	}
}
