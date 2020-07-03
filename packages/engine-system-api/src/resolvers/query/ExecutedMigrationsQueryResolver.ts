import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { QueryResolver } from '../Resolver'
import { ExecutedMigration, QueryExecutedMigrationsArgs } from '../../schema'
import { ExecutedMigrationByVersionQuery, ExecutedMigrationsQuery } from '../../model'

export class ExecutedMigrationsQueryResolver implements QueryResolver<'executedMigrations'> {
	async executedMigrations(
		parent: any,
		args: QueryExecutedMigrationsArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ExecutedMigration[]> {
		if (args.version) {
			const migration = await context.db.queryHandler.fetch(new ExecutedMigrationByVersionQuery(args.version))
			return migration ? [migration] : []
		}
		return await context.db.queryHandler.fetch(new ExecutedMigrationsQuery())
	}
}
