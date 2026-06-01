import { GraphQLResolveInfo } from 'graphql'
import { SystemResolverContext } from '../SystemResolverContext.js'
import { QueryResolver } from '../Resolver.js'
import { AuthorizationActions, StagesQuery } from '../../model/index.js'

export class SchemaQueryResolver implements QueryResolver<'schema'> {
	async schema(
		parent: any,
		args: unknown,
		context: SystemResolverContext,
		info: GraphQLResolveInfo,
	) {
		const stages = await context.db.queryHandler.fetch(new StagesQuery())
		for (const stage of stages) {
			await context.requireAccess(AuthorizationActions.PROJECT_SHOW_SCHEMA, stage.slug)
		}
		return context.getSchema()
	}
}
