import { IdentityProvider, QueryResolvers } from '../../schema'
import { ResolverContext } from '../ResolverContext'
import { IdentityProvidersQuery } from '../../model'

export class IDPQueryResolver implements QueryResolvers {
	async identityProviders(parent: unknown, args: unknown, context: ResolverContext): Promise<IdentityProvider[]> {
		return await context.db.queryHandler.fetch(new IdentityProvidersQuery())
	}
}
