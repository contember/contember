import { AuthorizationScope, Authorizator } from '@contember/authorization'
import { Identity } from '@contember/engine-common'
import { Acl } from '@contember/schema'
import { SystemExecutionContainer } from '../SystemExecutionContainer'
import { ForbiddenError } from 'apollo-server-errors'

export const createResolverContext = (
	identity: Identity,
	variables: Acl.VariablesMap,
	authorizator: Authorizator<Identity>,
	container: SystemExecutionContainer,
): ResolverContext => {
	return {
		identity,
		variables,
		authorizator,
		container,
		isAllowed: async (scope, action) => await authorizator.isAllowed(identity, scope, action),
		requireAccess: async (scope, action, message?) => {
			if (!(await authorizator.isAllowed(identity, scope, action))) {
				throw new ForbiddenError(message || 'Forbidden')
			}
		},
	}
}

export interface ResolverContext {
	readonly identity: Identity
	readonly variables: Acl.VariablesMap
	readonly authorizator: Authorizator<Identity>
	readonly container: SystemExecutionContainer
	readonly isAllowed: (scope: AuthorizationScope<Identity>, action: Authorizator.Action) => Promise<boolean>
	readonly requireAccess: (
		scope: AuthorizationScope<Identity>,
		action: Authorizator.Action,
		message?: string,
	) => Promise<void>
}
