import { AccessNode, AuthorizationScope } from '@contember/authorization'
import { Identity } from './Identity'

export class ProjectScope implements AuthorizationScope<Identity> {
	constructor(private readonly project: { slug: string } | null) {}

	async getIdentityAccess(identity: Identity): Promise<AccessNode> {
		if (!this.project) {
			return new AccessNode.Roles([])
		}
		return new AccessNode.Roles(identity.projectRoles)
	}
}
