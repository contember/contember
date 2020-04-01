import { AuthorizationScope, Authorizator } from '@contember/authorization'
import { Identity } from '@contember/engine-common'
import { Acl } from '@contember/schema'
import { ForbiddenError } from 'apollo-server-errors'
import { DatabaseContext, DatabaseContextFactory } from '../model'

export class ResolverContextFactory {
	constructor(
		private readonly systemDbContext: DatabaseContextFactory,
		private readonly authorizator: Authorizator<Identity>,
	) {}

	public create(identity: Identity, variables: Acl.VariablesMap): ResolverContext {
		return {
			identity,
			variables,
			authorizator: this.authorizator,
			db: this.systemDbContext.create(identity.id),
			isAllowed: async (scope, action) => await this.authorizator.isAllowed(identity, scope, action),
			requireAccess: async (scope, action, message?) => {
				if (!(await this.authorizator.isAllowed(identity, scope, action))) {
					throw new ForbiddenError(message || 'Forbidden')
				}
			},
		}
	}
}

export interface ResolverContext {
	readonly identity: Identity
	readonly db: DatabaseContext
	readonly variables: Acl.VariablesMap
	readonly authorizator: Authorizator<Identity>
	readonly isAllowed: (scope: AuthorizationScope<Identity>, action: Authorizator.Action) => Promise<boolean>
	readonly requireAccess: (
		scope: AuthorizationScope<Identity>,
		action: Authorizator.Action,
		message?: string,
	) => Promise<void>
}
