import { Identity, QueryResolvers } from '../../schema/types'
import ResolverContext from '../ResolverContext'

export default class MeQueryResolver implements QueryResolvers {
	me(parent: unknown, args: unknown, context: ResolverContext): Identity {
		return {
			id: context.identity.id,
			projects: [],
			person: null,
		}
	}
}
