import { IdentityProvider, QueryResolvers } from '../../schema'
import { IdentityProvidersQuery } from '../../model'
import { TenantResolverContext } from '../TenantResolverContext'

export class IDPQueryResolver implements QueryResolvers {
	async identityProviders(parent: unknown, args: unknown, context: TenantResolverContext): Promise<IdentityProvider[]> {
		return await context.db.queryHandler.fetch(new IdentityProvidersQuery())
	}
}
