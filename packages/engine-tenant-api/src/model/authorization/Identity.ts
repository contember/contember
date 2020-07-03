import { ProjectMemberManager } from '../service'
import { Membership } from '../type/Membership'

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
		private readonly memberManager: ProjectMemberManager,
	) {}

	async getProjectMemberships(projectSlug: string): Promise<readonly Membership[]> {
		return await this.memberManager.getProjectMemberships({ slug: projectSlug }, this, undefined)
	}
}
