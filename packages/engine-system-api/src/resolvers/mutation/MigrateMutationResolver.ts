import { GraphQLResolveInfo } from 'graphql'
import { SystemResolverContext } from '../SystemResolverContext.js'
import { MutationResolver } from '../Resolver.js'
import { MigrateResponse, MutationMigrateArgs } from '../../schema/index.js'
import { Migration } from '@contember/schema-migrations'
import { AuthorizationActions, MigrationError, ProjectMigrator, StagesQuery } from '../../model/index.js'

export class MigrateMutationResolver implements MutationResolver<'migrate'> {
	constructor(private readonly projectMigrator: ProjectMigrator) {}

	async migrateForce(
		parent: any,
		args: MutationMigrateArgs,
		context: SystemResolverContext,
		info: GraphQLResolveInfo,
	): Promise<MigrateResponse> {
		return this.migrate(parent, args, context, info, true)
	}

	async migrate(
		parent: any,
		args: MutationMigrateArgs,
		context: SystemResolverContext,
		info: GraphQLResolveInfo,
		force = false,
	): Promise<MigrateResponse> {
		const migrations = args.migrations as readonly Migration[]

		return context.db.transaction(async trx => {
			const stages = await trx.queryHandler.fetch(new StagesQuery())
			for (const stage of stages) {
				await context.requireAccess(AuthorizationActions.PROJECT_MIGRATE, stage.slug)
			}
			try {
				await this.projectMigrator.migrate(trx, stages, migrations, () => null, force)
			} catch (e) {
				if (e instanceof MigrationError) {
					await trx.client.connection.rollback()
					const error = {
						code: e.code,
						migration: e.version,
						developerMessage: e.message,
					}
					return {
						ok: false,
						errors: [error],
						error,
					}
				} else {
					throw e
				}
			}
			return {
				ok: true,
				errors: [],
			}
		})
	}
}
