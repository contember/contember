import AuthorizationScope from './AuthorizationScope'
import AccessEvaluator from './AccessEvalutator'
import AccessNode from './AccessNode'

class Authorizator<Identity extends Authorizator.Identity> {
	constructor(private readonly accessEvaluator: AccessEvaluator) {}

	public async isAllowed(
		identity: Identity,
		scope: AuthorizationScope<Identity>,
		action: Authorizator.Action
	): Promise<boolean> {
		const scopeNode = await scope.getIdentityAccess(identity)
		const globalNode = new AccessNode.Roles(identity.roles)
		const node = new AccessNode.Union([scopeNode, globalNode])

		return await node.isAllowed(this.accessEvaluator, action)
	}
}

namespace Authorizator {
	export type Resource = string
	export type Privilege = string
	export type Action = [Resource, Privilege]

	export interface Identity {
		roles: string[]
	}
}

export default Authorizator
