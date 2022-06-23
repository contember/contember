import AccessNode from './AccessNode.js'

interface AuthorizationScope<Identity> {
	getIdentityAccess(identity: Identity): Promise<AccessNode>
}

namespace AuthorizationScope {
	export class Fixed implements AuthorizationScope<any> {
		constructor(private readonly node: AccessNode) {}

		async getIdentityAccess(): Promise<AccessNode> {
			return this.node
		}
	}

	export class Global implements AuthorizationScope<any> {
		async getIdentityAccess(identity: any): Promise<AccessNode> {
			return AccessNode.Fixed.denied()
		}
	}

	export class Intersection<Identity> implements AuthorizationScope<Identity> {
		constructor(private readonly scopes: AuthorizationScope<Identity>[]) {}

		async getIdentityAccess(identity: Identity): Promise<AccessNode> {
			const nodes: Promise<AccessNode>[] = []
			for (let scope of this.scopes) {
				nodes.push(scope.getIdentityAccess(identity))
			}
			return new AccessNode.Intersection(await Promise.all(nodes))
		}
	}

	export class Union<Identity> implements AuthorizationScope<Identity> {
		constructor(private readonly scopes: AuthorizationScope<Identity>[]) {}

		async getIdentityAccess(identity: Identity): Promise<AccessNode> {
			const nodes: Promise<AccessNode>[] = []
			for (let scope of this.scopes) {
				nodes.push(scope.getIdentityAccess(identity))
			}
			return new AccessNode.Union(await Promise.all(nodes))
		}
	}
}

export default AuthorizationScope
