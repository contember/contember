import { IdentityProvider, QueryResolvers } from '../../schema'
import { IdentityProvidersQuery, PermissionActions } from '../../model'
import { TenantResolverContext } from '../TenantResolverContext'

export class IDPQueryResolver implements QueryResolvers {
	async identityProviders(parent: unknown, args: unknown, context: TenantResolverContext): Promise<IdentityProvider[]> {
		await context.requireAccess({
			action: PermissionActions.IDP_LIST,
			message: 'You are not allowed to list IDP',
		})

		return await context.db.queryHandler.fetch(new IdentityProvidersQuery())
	}
}
