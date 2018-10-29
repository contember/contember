import AuthorizationScope from '../../core/authorization/AuthorizationScope'
import Authorizator from '../../core/authorization/Authorizator'
import Identity from '../model/type/Identity'

export default class ResolverContext {
	constructor(
		public readonly apiKeyId: string,
		public readonly identity: Identity,
		private readonly authorizator: Authorizator<Identity>
	) {}

	public async isAllowed(scope: AuthorizationScope<Identity>, action: Authorizator.Action): Promise<boolean> {
		return await this.authorizator.isAllowed(this.identity, scope, action)
	}
}
