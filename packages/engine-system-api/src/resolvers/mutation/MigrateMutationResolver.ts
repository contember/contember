import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { MigrateResponse, MutationMigrateArgs } from '../../schema'
import { Migration } from '@contember/schema-migrations'
import { AuthorizationActions, MigrationError, ProjectMigrator, ProjectScope } from '../../model'

export class MigrateMutationResolver implements MutationResolver<'migrate'> {
	constructor(private readonly projectMigrator: ProjectMigrator) {}
	async migrate(
		parent: any,
		args: MutationMigrateArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<MigrateResponse> {
		await context.requireAccess(new ProjectScope(context.project), AuthorizationActions.PROJECT_MIGRATE)
		const migrations: Migration[] = []
		for (const { formatVersion, name, version, modifications } of args.migrations) {
			migrations.push({
				formatVersion,
				name,
				version,
				modifications: modifications.map(({ modification, data }) => ({ modification, ...JSON.parse(data) })),
			})
		}

		return context.db.transaction(async trx => {
			try {
				await this.projectMigrator.migrate(trx, context.project, migrations, () => null)
			} catch (e) {
				if (e instanceof MigrationError) {
					await trx.client.connection.rollback()
					return {
						ok: false,
						errors: [
							{
								code: e.code,
								migration: e.version,
								message: e.message,
							},
						],
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
