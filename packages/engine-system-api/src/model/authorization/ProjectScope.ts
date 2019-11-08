import { AccessNode, AuthorizationScope } from '@contember/authorization'
import { Identity } from '@contember/engine-common'

export class ProjectScope implements AuthorizationScope<Identity> {
	constructor(private readonly project: { slug: string } | null) {}

	async getIdentityAccess(identity: Identity): Promise<AccessNode> {
		if (!this.project) {
			return new AccessNode.Roles([])
		}
		const roles = await identity.getProjectRoles(this.project.slug)
		return new AccessNode.Roles(roles)
	}
}
