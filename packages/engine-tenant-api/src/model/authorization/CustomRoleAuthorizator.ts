import { Authorizator, Permissions } from '@contember/authorization'
import { DatabaseContext } from '../utils/index.js'
import { CustomRolesQuery } from '../queries/index.js'
import { Identity } from './Identity.js'
import { buildCustomRolePermissions, BUILTIN_TENANT_ROLES } from './CustomRolePermissions.js'

export class CustomRolePermissionCache {
	private loading: Promise<Permissions> | undefined

	constructor(private readonly db: DatabaseContext) {}

	load(): Promise<Permissions> {
		this.loading ??= this.db.queryHandler.fetch(new CustomRolesQuery()).then(buildCustomRolePermissions)
		return this.loading
	}
}

export class CustomRoleAuthorizator implements Authorizator<Identity> {
	constructor(
		private readonly inner: Authorizator<Identity>,
		db: DatabaseContext,
		public readonly customRoleCache = new CustomRolePermissionCache(db),
	) {
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
		const permissions = await this.customRoleCache.load()
		return customRoles.some(role => permissions.isAllowed(role, action.resource, action.privilege, action.meta))
	}
}
