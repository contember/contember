import AuthorizationScope from '../../core/authorization/AuthorizationScope'
import Authorizator from '../../core/authorization/Authorizator'
import Identity from '../../common/auth/Identity'
import { ForbiddenError } from 'apollo-server-koa'

export default class ResolverContext {
	constructor(
		public readonly apiKeyId: string,
		public readonly identity: Identity,
		private readonly authorizator: Authorizator<Identity>
	) {}

	public async isAllowed(scope: AuthorizationScope<Identity>, action: Authorizator.Action): Promise<boolean> {
		return await this.authorizator.isAllowed(this.identity, scope, action)
	}

	public async requireAccess(
		{ scope, action, message }: {
			scope?: AuthorizationScope<Identity>,
			action: Authorizator.Action,
			message?: string
		}
	): Promise<void> {
		if (!(await this.isAllowed(scope || new AuthorizationScope.Global(), action))) {
			throw new ForbiddenError(message || 'Forbidden')
		}
	}
}
