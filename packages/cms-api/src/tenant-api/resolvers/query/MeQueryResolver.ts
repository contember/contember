import { Identity, QueryResolvers } from '../../schema/types'
import ResolverContext from '../ResolverContext'

export default class MeQueryResolver implements QueryResolvers {
	me({}, {}, context: ResolverContext): Identity {
		return {
			id: context.identity.id,
			projects: [],
			person: null,
		}
	}
}
