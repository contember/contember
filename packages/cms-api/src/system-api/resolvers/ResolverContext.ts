import { Authorizator, AuthorizationScope } from '@contember/authorization'
import { Identity } from '@contember/engine-common'
import { Acl } from '@contember/schema'
import SystemExecutionContainer from '../SystemExecutionContainer'
import ErrorHandlerExtension from '../../core/graphql/ErrorHandlerExtension'
import { ForbiddenError } from 'apollo-server-koa'

export default class ResolverContext implements ErrorHandlerExtension.Context {
	constructor(
		public readonly identity: Identity,
		public readonly variables: Acl.VariablesMap,
		private readonly authorizator: Authorizator<Identity>,
		public readonly container: SystemExecutionContainer,
		public readonly errorHandler: ErrorHandlerExtension.Context['errorHandler'],
	) {}

	public async isAllowed(scope: AuthorizationScope<Identity>, action: Authorizator.Action): Promise<boolean> {
		return await this.authorizator.isAllowed(this.identity, scope, action)
	}

	public async requireAccess(
		scope: AuthorizationScope<Identity>,
		action: Authorizator.Action,
		message?: string,
	): Promise<void> {
		if (!(await this.isAllowed(scope, action))) {
			throw new ForbiddenError(message || 'Forbidden')
		}
	}
}
