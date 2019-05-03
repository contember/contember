import AuthorizationScope from '../../../core/authorization/AuthorizationScope'
import Identity from '../../../common/auth/Identity'
import AccessNode from '../../../core/authorization/AccessNode'

class IdentityScope implements AuthorizationScope<Identity> {
	constructor(private readonly identityId: string) {}

	async getIdentityAccess(identity: Identity): Promise<AccessNode> {
		return new AccessNode.Roles(identity.id === this.identityId ? [Identity.SystemRole.SELF] : [])
	}
}

export default IdentityScope
