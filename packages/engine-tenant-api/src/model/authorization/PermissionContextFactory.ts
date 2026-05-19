import { Authorizator } from '@contember/authorization'
import { IdentityFactory } from './IdentityFactory.js'
import { PermissionContext } from './PermissionContext.js'
import { ProjectScopeFactory } from './ProjectScopeFactory.js'
import { ProjectSchemaResolver } from '../type/index.js'
import { DatabaseContext } from '../utils/index.js'
import { TenantDbPolicyProvider } from '../policy/TenantDbPolicyProvider.js'

export class PermissionContextFactory {
	constructor(
		private readonly authorizator: Authorizator,
		private readonly identityFactory: IdentityFactory,
		private readonly projectScopeFactory: ProjectScopeFactory,
		private readonly schemaResolver: ProjectSchemaResolver,
	) {}

	public create(db: DatabaseContext, args: { id: string; roles: readonly string[] }): PermissionContext {
		const identity = this.identityFactory.create(db, args)
		const tenantPolicies = new TenantDbPolicyProvider(db, { id: args.id, roles: args.roles })
		return new PermissionContext(
			identity,
			this.authorizator,
			this.projectScopeFactory,
			this.schemaResolver,
			[tenantPolicies],
		)
	}
}
