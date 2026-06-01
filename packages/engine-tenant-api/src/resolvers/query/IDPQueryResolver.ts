import { IdentityProvider, QueryResolvers } from '../../schema/index.js'
import { PermissionActions } from '../../model/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { IDPManager } from '../../model/service/idp/IDPManager.js'

export class IDPQueryResolver implements QueryResolvers {
	constructor(
		private readonly idpManager: IDPManager,
	) {
	}

	async identityProviders(parent: unknown, args: unknown, context: TenantResolverContext): Promise<IdentityProvider[]> {
		await context.requireAccess({
			action: PermissionActions.IDP_LIST,
			message: 'You are not allowed to list IDP',
		})

		return await this.idpManager.listIDP(context.db)
	}
}
