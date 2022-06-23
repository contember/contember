import { IdentityProvider, QueryResolvers } from '../../schema/index.js'
import { IdentityProvidersQuery } from '../../model/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'

export class IDPQueryResolver implements QueryResolvers {
	async identityProviders(parent: unknown, args: unknown, context: TenantResolverContext): Promise<IdentityProvider[]> {
		return await context.db.queryHandler.fetch(new IdentityProvidersQuery())
	}
}
