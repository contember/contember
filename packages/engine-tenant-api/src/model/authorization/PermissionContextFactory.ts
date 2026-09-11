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
		const authorizator = this.createAuthorizator(db, requestAuthorizator)
		return this.buildContext(db, args, authorizator)
	}

	/**
	 * Same as `create`, but resolves the custom-role definitions before returning, so
	 * the request never has to query for them while holding a transaction open.
	 */
	public async createPreloaded(
		db: DatabaseContext,
		args: { id: string; roles: readonly string[] },
		requestAuthorizator?: Authorizator<Identity>,
	): Promise<PermissionContext> {
		const authorizator = this.createAuthorizator(db, requestAuthorizator)
		await authorizator.preload(args.roles)
		return this.buildContext(db, args, authorizator)
	}

	private createAuthorizator(db: DatabaseContext, requestAuthorizator?: Authorizator<Identity>): CustomRoleAuthorizator {
		const customRoleCache = requestAuthorizator instanceof CustomRoleAuthorizator
			? requestAuthorizator.customRoleCache
			: undefined
		return new CustomRoleAuthorizator(this.authorizator, db, customRoleCache)
	}

	private buildContext(
		db: DatabaseContext,
		args: { id: string; roles: readonly string[] },
		authorizator: CustomRoleAuthorizator,
	): PermissionContext {
		const identity = this.identityFactory.create(db, args)
		return new PermissionContext(identity, authorizator, this.projectScopeFactory, this.schemaResolver)
	}
}
