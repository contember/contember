import { GraphQLResolveInfo } from 'graphql'
import { SystemResolverContext } from '../SystemResolverContext.js'
import { QueryResolver } from '../Resolver.js'
import { ExecutedMigration, QueryExecutedMigrationsArgs } from '../../schema/index.js'
import { AuthorizationActions, ExecutedMigrationByVersionQuery, ExecutedMigrationsQuery, StagesQuery } from '../../model/index.js'

export class ExecutedMigrationsQueryResolver implements QueryResolver<'executedMigrations'> {
	async executedMigrations(
		parent: any,
		args: QueryExecutedMigrationsArgs,
		context: SystemResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ExecutedMigration[]> {
		const stages = await context.db.queryHandler.fetch(new StagesQuery())
		for (const stage of stages) {
			await context.requireAccess(AuthorizationActions.PROJECT_LIST_MIGRATIONS, stage.slug)
		}

		if (args.version) {
			const migration = await context.db.queryHandler.fetch(new ExecutedMigrationByVersionQuery(args.version))
			return migration ? [migration] : []
		}
		return await context.db.queryHandler.fetch(new ExecutedMigrationsQuery())
	}
}
