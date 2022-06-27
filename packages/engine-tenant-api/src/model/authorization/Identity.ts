import { ProjectMemberManager } from '../service'
import { DatabaseContext } from '../utils'
import { Acl } from '@contember/schema'

export interface Identity {
	readonly id: string
	readonly roles: readonly string[]

	getProjectMemberships(projectSlug: string): Promise<readonly Acl.Membership[]>
}

export class StaticIdentity implements Identity {
	constructor(
		public readonly id: string,
		public readonly roles: string[],
		private projectMemberships: Record<string, readonly Acl.Membership[]> = {},
	) {}

	getProjectMemberships(projectSlug: string): Promise<readonly Acl.Membership[]> {
		return Promise.resolve(this.projectMemberships[projectSlug] || {})
	}
}

export class ProjectAwareIdentity implements Identity {
	constructor(
		public readonly id: string,
		public readonly roles: readonly string[],
		private readonly dbContext: DatabaseContext,
		private readonly memberManager: ProjectMemberManager,
	) {}

	async getProjectMemberships(projectSlug: string): Promise<readonly Acl.Membership[]> {
		return await this.memberManager.getProjectMemberships(this.dbContext, { slug: projectSlug }, this, undefined)
	}
}
