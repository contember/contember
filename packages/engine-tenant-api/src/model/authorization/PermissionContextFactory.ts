import { AccessEvaluator, Authorizator, Permissions } from '@contember/authorization'
import { IdentityFactory } from './IdentityFactory.js'
import { PermissionContext } from './PermissionContext.js'
import { ProjectScopeFactory } from './ProjectScopeFactory.js'
import { ProjectSchemaResolver } from '../type/index.js'
import { DatabaseContext } from '../utils/index.js'
import { CustomRoleAccessEvaluator } from './CustomRoleAccessEvaluator.js'

export class PermissionContextFactory {
	constructor(
		private readonly permissions: Permissions,
		private readonly identityFactory: IdentityFactory,
		private readonly projectScopeFactory: ProjectScopeFactory,
		private readonly schemaResolver: ProjectSchemaResolver,
	) {}

	public create(db: DatabaseContext, args: { id: string; roles: readonly string[] }): PermissionContext {
		const identity = this.identityFactory.create(db, args)
		// Per-request authorizator: the evaluator lazily loads custom roles from this request's DB and memoizes them.
		const evaluator = new CustomRoleAccessEvaluator(new AccessEvaluator.PermissionEvaluator(this.permissions), db)
		const authorizator = new Authorizator.Default(evaluator)
		return new PermissionContext(identity, authorizator, this.projectScopeFactory, this.schemaResolver)
	}
}
