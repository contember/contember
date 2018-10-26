import AuthorizationScope from '../../../core/authorization/AuthorizationScope'
import Identity from '../type/Identity'
import AccessNode from '../../../core/authorization/AccessNode'

class ProjectScope implements AuthorizationScope<Identity> {
	constructor(private readonly projectId: string) {}

	async getIdentityAccess(identity: Identity): Promise<AccessNode> {
		return new AccessNode.Roles(await identity.getProjectRoles(this.projectId))
	}
}

export default ProjectScope
