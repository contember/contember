import { AuthorizationScope, AccessNode } from '@contember/authorization'
import { Identity } from '@contember/engine-common'
import { Project } from '../type'

class ProjectScope implements AuthorizationScope<Identity> {
	constructor(private readonly project: Pick<Project, 'slug'> | null) {}

	async getIdentityAccess(identity: Identity): Promise<AccessNode> {
		if (!this.project) {
			return new AccessNode.Roles([])
		}
		const roles = await identity.getProjectRoles(this.project.slug)
		return new AccessNode.Roles(roles.length > 0 ? [...roles, Identity.SystemRole.PROJECT_MEMBER] : [])
	}
}

export { ProjectScope }
