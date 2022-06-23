import { GraphQLResolveInfo } from 'graphql'
import { SystemResolverContext } from '../SystemResolverContext.js'
import { QueryResolver } from '../Resolver.js'
import { Stage } from '../../schema/index.js'
import { StagesQuery } from '../../model/index.js'

export class StagesQueryResolver implements QueryResolver<'stages'> {
	async stages(parent: any, args: any, context: SystemResolverContext, info: GraphQLResolveInfo): Promise<Stage[]> {
		return context.db.queryHandler.fetch(new StagesQuery())
	}
}
