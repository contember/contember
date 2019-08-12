import { Identity } from '@contember/engine-common'
import ProjectMemberManager from '../service/ProjectMemberManager'

class ProjectAwareIdentity implements Identity {
	constructor(
		public readonly id: string,
		public readonly roles: string[],
		private readonly memberManager: ProjectMemberManager,
	) {}

	async getProjectRoles(projectId: string): Promise<string[]> {
		return (await this.memberManager.getProjectRoles(projectId, this.id)).roles
	}
}

export default ProjectAwareIdentity
