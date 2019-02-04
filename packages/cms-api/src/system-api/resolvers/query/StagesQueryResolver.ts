import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import { QueryResolver } from '../Resolver'
import { Stage } from '../../schema/types'
import StagesQuery from '../../model/queries/StagesQuery'

export default class StagesQueryResolver implements QueryResolver<'stages'> {
	async stages(parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo): Promise<Stage[]> {
		return context.container.queryHandler.fetch(new StagesQuery())
	}
}
