import { Identity, QueryResolvers } from '../../schema'
import { TenantResolverContext } from '../TenantResolverContext'

export class MeQueryResolver implements QueryResolvers {
	me(parent: unknown, args: unknown, context: TenantResolverContext): Identity {
		return {
			id: context.identity.id,
			projects: [],
			person: null,
		}
	}
}
