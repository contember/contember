import { AuthorizationScope, AccessNode } from '@contember/authorization'
import { Identity } from '@contember/engine-common'
import { Project } from '../type'

class ProjectScope implements AuthorizationScope<Identity> {
	constructor(private readonly project: Project | null) {}

	async getIdentityAccess(identity: Identity): Promise<AccessNode> {
		return this.project
			? new AccessNode.Roles(await identity.getProjectRoles(this.project.slug))
			: new AccessNode.Roles([])
	}
}

export { ProjectScope }
