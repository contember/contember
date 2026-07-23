import { Authorizator } from '@contember/authorization'
import { IdentityFactory } from './IdentityFactory.js'
import { PermissionContext } from './PermissionContext.js'
import { ProjectScopeFactory } from './ProjectScopeFactory.js'
import { ProjectSchemaResolver } from '../type/index.js'
import { DatabaseContext } from '../utils/index.js'
import { CustomRoleAuthorizator } from './CustomRoleAuthorizator.js'
import { Identity } from './Identity.js'

export class PermissionContextFactory {
	constructor(
		private readonly authorizator: Authorizator<Identity>,
		private readonly identityFactory: IdentityFactory,
		private readonly projectScopeFactory: ProjectScopeFactory,
		private readonly schemaResolver: ProjectSchemaResolver,
	) {}

	public create(
		db: DatabaseContext,
		args: { id: string; roles: readonly string[] },
		requestAuthorizator?: Authorizator<Identity>,
	): PermissionContext {
		const identity = this.identityFactory.create(db, args)
		const customRoleCache = requestAuthorizator instanceof CustomRoleAuthorizator
			? requestAuthorizator.customRoleCache
			: undefined
		const authorizator = new CustomRoleAuthorizator(this.authorizator, db, customRoleCache)
		return new PermissionContext(identity, authorizator, this.projectScopeFactory, this.schemaResolver)
	}
}
