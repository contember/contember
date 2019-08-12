import { AuthorizationScope, AccessNode } from '@contember/authorization'
import Identity from '../../../common/auth/Identity'

class ProjectScope implements AuthorizationScope<Identity> {
	constructor(private readonly projectId: string) {}

	async getIdentityAccess(identity: Identity): Promise<AccessNode> {
		return new AccessNode.Roles(await identity.getProjectRoles(this.projectId))
	}
}

export default ProjectScope
