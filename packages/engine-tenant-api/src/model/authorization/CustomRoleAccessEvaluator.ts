import { AccessEvaluator, AccessNode, Authorizator, Permissions } from '@contember/authorization'
import { DatabaseContext } from '../utils/index.js'
import { CustomRolesQuery } from '../queries/index.js'
import { buildCustomRolePermissions, BUILTIN_TENANT_ROLES } from './CustomRolePermissions.js'

/**
 * Access evaluator extending the static built-in role permissions with custom roles
 * defined in the `custom_role` table. Static permissions are consulted first; the DB
 * is only hit when the evaluated node carries a non-builtin role, and at most once
 * per instance (one instance = one request, see PermissionContextFactory).
 */
export class CustomRoleAccessEvaluator implements AccessEvaluator {
	private loaded = new Map<string, Promise<Permissions>>()

	constructor(
		private readonly inner: AccessEvaluator,
		private readonly db: DatabaseContext,
	) {}

	async evaluate(node: AccessNode, action: Authorizator.Action): Promise<boolean> {
		if (await this.inner.evaluate(node, action)) {
			return true
		}
		if (!(node instanceof AccessNode.Roles)) {
			return false
		}
		const customRoles = node.roles.filter(it => !BUILTIN_TENANT_ROLES.has(it))
		if (customRoles.length === 0) {
			return false
		}
		const permissions = await this.load(customRoles)
		return customRoles.some(role => permissions.isAllowed(role, action.resource, action.privilege, action.meta))
	}

	private load(slugs: readonly string[]): Promise<Permissions> {
		const key = [...slugs].sort().join('\n')
		let loading = this.loaded.get(key)
		if (loading === undefined) {
			loading = this.db.queryHandler
				.fetch(new CustomRolesQuery({ slugs }))
				.then(buildCustomRolePermissions)
			this.loaded.set(key, loading)
		}
		return loading
	}
}
