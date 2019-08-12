import { Identity, QueryResolvers } from '../../schema'
import { ResolverContext } from '../ResolverContext'

export class MeQueryResolver implements QueryResolvers {
	me(parent: unknown, args: unknown, context: ResolverContext): Identity {
		return {
			id: context.identity.id,
			projects: [],
			person: null,
		}
	}
}
