import { IdentityFactory } from './IdentityFactory'
import { PermissionContext } from './PermissionContext'
import { ProjectSchemaResolver } from '../type'
import { DatabaseContext } from '../utils'

export class PermissionContextFactory {
	constructor(
		private readonly identityFactory: IdentityFactory,
		private readonly schemaResolver: ProjectSchemaResolver,
		// Used for custom-policy (`identity_policy`) lookups. Intentionally the
		// container-wide context, not the per-request `db` passed to `create`:
		// policy assignments are committed tenant-global state, read the same way
		// regardless of the request's transaction.
		private readonly policyDatabaseContext: DatabaseContext,
	) {}

	public create(db: DatabaseContext, args: { id: string; roles: readonly string[] }): PermissionContext {
		const identity = this.identityFactory.create(db, args)
		return new PermissionContext(identity, this.policyDatabaseContext, this.schemaResolver)
	}
}
