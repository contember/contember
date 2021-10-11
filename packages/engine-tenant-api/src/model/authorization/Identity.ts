import { ProjectMemberManager } from '../service'
import { Membership } from '../type/Membership'
import { DatabaseContext } from '../utils'

export interface Identity {
	readonly id: string
	readonly roles: string[]

	getProjectMemberships(projectSlug: string): Promise<readonly Membership[]>
}

export class StaticIdentity implements Identity {
	constructor(
		public readonly id: string,
		public readonly roles: string[],
		private projectMemberships: Record<string, readonly Membership[]> = {},
	) {}

	getProjectMemberships(projectSlug: string): Promise<readonly Membership[]> {
		return Promise.resolve(this.projectMemberships[projectSlug] || {})
	}
}

export class ProjectAwareIdentity implements Identity {
	constructor(
		public readonly id: string,
		public readonly roles: string[],
		private readonly dbContext: DatabaseContext,
		private readonly memberManager: ProjectMemberManager,
	) {}

	async getProjectMemberships(projectSlug: string): Promise<readonly Membership[]> {
		return await this.memberManager.getProjectMemberships(this.dbContext, { slug: projectSlug }, this, undefined)
	}
}
