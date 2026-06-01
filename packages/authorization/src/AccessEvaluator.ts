import { Permissions } from './Permissions.js'
import { AccessNode } from './AccessNode.js'
import { Authorizator } from './Authorizator.js'

interface AccessEvaluator {
	evaluate(accessNode: AccessNode, action: Authorizator.Action): Promise<boolean>
}

namespace AccessEvaluator {
	export class PermissionEvaluator implements AccessEvaluator {
		constructor(private readonly permissions: Permissions) {}

		async evaluate(accessNode: AccessNode, { resource, privilege, meta }: Authorizator.Action<any>): Promise<boolean> {
			if (!(accessNode instanceof AccessNode.Roles)) {
				throw new UnsupportedAccessNodeError()
			}
			for (let role of accessNode.roles) {
				if (this.permissions.isAllowed(role, resource, privilege, meta)) {
					return true
				}
			}
			return false
		}
	}

	class UnsupportedAccessNodeError extends Error {}
}

export { AccessEvaluator }
