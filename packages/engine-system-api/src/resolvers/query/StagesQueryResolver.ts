import { GraphQLResolveInfo } from 'graphql'
import { SystemResolverContext } from '../SystemResolverContext'
import { QueryResolver } from '../Resolver'
import { Stage } from '../../schema'
import { StagesQuery } from '../../model'

export class StagesQueryResolver implements QueryResolver<'stages'> {
	async stages(parent: any, args: any, context: SystemResolverContext, info: GraphQLResolveInfo): Promise<Stage[]> {
		return context.db.queryHandler.fetch(new StagesQuery())
	}
}
