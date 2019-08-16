import { Identity } from '@contember/engine-common'
import { ProjectMemberManager } from '../'

class ProjectAwareIdentity implements Identity {
	constructor(
		public readonly id: string,
		public readonly roles: string[],
		private readonly memberManager: ProjectMemberManager,
	) {}

	async getProjectRoles(projectSlug: string): Promise<string[]> {
		return (await this.memberManager.getProjectBySlugRoles(projectSlug, this.id)).roles
	}
}

export { ProjectAwareIdentity }
