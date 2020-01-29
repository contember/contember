import AuthorizationScope from './AuthorizationScope'
import AccessEvaluator from './AccessEvaluator'
import AccessNode from './AccessNode'

interface Authorizator<Identity extends Authorizator.Identity = Authorizator.Identity> {
	isAllowed(identity: Identity, scope: AuthorizationScope<Identity>, action: Authorizator.Action): Promise<boolean>
}

namespace Authorizator {
	export type Resource = string
	export type Privilege = string
	export type Action = { resource: Resource; privilege: Privilege }

	export const createAction = (resource: Resource, privilege: Privilege): Action => ({ resource, privilege })

	export class Default<Identity extends Authorizator.Identity> implements Authorizator<Identity> {
		constructor(private readonly accessEvaluator: AccessEvaluator) {}

		public async isAllowed(
			identity: Identity,
			scope: AuthorizationScope<Identity>,
			action: Authorizator.Action,
		): Promise<boolean> {
			const scopeNode = await scope.getIdentityAccess(identity)
			const globalNode = new AccessNode.Roles(identity.roles)
			const node = new AccessNode.Union([scopeNode, globalNode])

			return await node.isAllowed(this.accessEvaluator, action)
		}
	}

	export interface Identity {
		roles: string[]
	}
}

export default Authorizator
