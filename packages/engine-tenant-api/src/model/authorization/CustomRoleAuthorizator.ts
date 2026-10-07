import { AuthorizationScope, Authorizator, Permissions } from '@contember/authorization'
import { DatabaseContext } from '../utils/index.js'
import { CustomRolesQuery } from '../queries/index.js'
import { Identity } from './Identity.js'
import { IdentityScope } from './IdentityScope.js'
import { buildCustomRolePermissions, BUILTIN_TENANT_ROLES } from './CustomRolePermissions.js'

export class CustomRolePermissionCache {
	private loading: Promise<{ readonly global: Permissions; readonly projectScoped: Permissions }> | undefined

	constructor(private readonly db: DatabaseContext) {}

	/**
	 * One query, two maps. `projectScoped` holds only the grants that carry their own project
	 * filter, because the scope itself is not passed down to `Permissions.isAllowed`.
	 */
	load(): Promise<{ readonly global: Permissions; readonly projectScoped: Permissions }> {
		this.loading ??= this.db.queryHandler.fetch(new CustomRolesQuery()).then(rows => ({
			global: buildCustomRolePermissions(rows),
			projectScoped: buildCustomRolePermissions(rows, { projectScoped: true }),
		}))
		return this.loading
	}
}

/**
 * Which scopes bound a check to one project. `Global` is unbounded and `IdentityScope` only *widens*
 * (it adds `self` when the target is the caller), so neither constrains what a grant may reach —
 * everything else is treated as project-bounded, so a scope kind added later fails closed rather
 * than letting a tenant-global grant answer for every project.
 */
const isProjectBoundedScope = (scope: AuthorizationScope<Identity>): boolean =>
	!(scope instanceof AuthorizationScope.Global) && !(scope instanceof IdentityScope)

export class CustomRoleAuthorizator implements Authorizator<Identity> {
	constructor(
		private readonly inner: Authorizator<Identity>,
		db: DatabaseContext,
		public readonly customRoleCache = new CustomRolePermissionCache(db),
	) {
	}

	/**
	 * Loads the definitions up front so no later check has to query mid-transaction —
	 * that would need a second pooled connection while the first one is pinned. No-op
	 * for identities carrying only built-in roles.
	 */
	async preload(roles: readonly string[]): Promise<void> {
		if (roles.some(role => !BUILTIN_TENANT_ROLES.has(role))) {
			await this.customRoleCache.load()
		}
	}

	async isAllowed(
		identity: Identity,
		scope: Parameters<Authorizator<Identity>['isAllowed']>[1],
		action: Authorizator.Action,
	): Promise<boolean> {
		if (await this.inner.isAllowed(identity, scope, action)) {
			return true
		}
		const customRoles = identity.roles.filter(role => !BUILTIN_TENANT_ROLES.has(role))
		if (customRoles.length === 0) {
			return false
		}
		// `Permissions.isAllowed` takes no scope, so a grant answering a project-bounded check would
		// answer it for every project. Only grants carrying their own project filter get to try.
		const loaded = await this.customRoleCache.load()
		const permissions = isProjectBoundedScope(scope) ? loaded.projectScoped : loaded.global
		return customRoles.some(role => permissions.isAllowed(role, action.resource, action.privilege, action.meta))
	}
}
