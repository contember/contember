import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { MigrateResponse, MutationMigrateArgs } from '../../schema'
import { Migration } from '@contember/schema-migrations'
import { AuthorizationActions, createStageTree, MigrationError, ProjectMigrator } from '../../model'

export class MigrateMutationResolver implements MutationResolver<'migrate'> {
	constructor(private readonly projectMigrator: ProjectMigrator) {}

	async migrateForce(
		parent: any,
		args: MutationMigrateArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<MigrateResponse> {
		return this.migrate(parent, args, context, info, true)
	}

	async migrate(
		parent: any,
		args: MutationMigrateArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
		force = false,
	): Promise<MigrateResponse> {
		const rootStageSlug = createStageTree(context.project).getRoot().slug
		await context.requireAccess(AuthorizationActions.PROJECT_MIGRATE, rootStageSlug)
		const migrations = args.migrations as readonly Migration[]

		return context.db.transaction(async trx => {
			try {
				await this.projectMigrator.migrate(trx, context.project, migrations, () => null, force)
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
