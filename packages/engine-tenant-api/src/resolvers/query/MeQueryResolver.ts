import { Identity, QueryResolvers } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'

export class MeQueryResolver implements QueryResolvers {
	me(parent: unknown, args: unknown, context: TenantResolverContext): Identity {
		return {
			id: context.identity.id,
			projects: [],
			person: null,
		}
	}
}
