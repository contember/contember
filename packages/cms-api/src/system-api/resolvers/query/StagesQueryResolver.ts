import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import { QueryResolver } from '../Resolver'
import { Stage } from '../../schema/types'
import StagesQuery from '../../model/queries/StagesQuery'

export default class StagesQueryResolver implements QueryResolver<'stages'> {
	constructor(private readonly queryHandler: QueryHandler<KnexQueryable>) {}

	async stages(parent: any, args: any, context: ResolverContext, info: GraphQLResolveInfo): Promise<Stage[]> {
		return this.queryHandler.fetch(new StagesQuery())
	}
}
