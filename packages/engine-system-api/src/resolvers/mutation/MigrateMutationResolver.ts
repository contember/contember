import { GraphQLResolveInfo } from 'graphql'
import { SystemResolverContext } from '../SystemResolverContext'
import { MutationResolver } from '../Resolver'
import { MigrateResponse, MigrationType, MutationMigrateArgs } from '../../schema'
import { Migration } from '@contember/schema-migrations'
import { AuthorizationActions, MigrationError, ProjectMigrator, StagesQuery } from '../../model'
import { MigrationInput } from '../../model/migrations/MigrationInput'
import { UserInputError } from '@contember/graphql-utils'
import { SchemaValidatorSkippedErrors } from '@contember/schema-utils'
import { assertNever } from '../../utils'

const pg_lock_id = 1597474138739147

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
		const migrations = this.parseMigrationInput(args)

		return context.db.locked(pg_lock_id, db => db.transaction(async trx => {
			const stages = await trx.queryHandler.fetch(new StagesQuery())
			for (const stage of stages) {
				await context.requireAccess(AuthorizationActions.PROJECT_MIGRATE, stage.slug)
			}
			try {
				await this.projectMigrator.migrate({
					db: trx,
					project: context.project,
					identity: context.identity,
					stages,
					migrationsToExecute: migrations,
					options: {
						ignoreOrder: force,
						skipExecuted: true,
					},
				})
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
		}))
	}

	private parseMigrationInput(args: MutationMigrateArgs): MigrationInput[] {
		return args.migrations.map((it): MigrationInput => {
			if (!it.type) {
				if (!it.modifications || !it.formatVersion) {
					throw new UserInputError('invalid migration format')
				}
				return {
					type: 'schema',
					formatVersion: it.formatVersion,
					modifications: it.modifications as Migration.Modification[],
					version: it.version,
					name: it.name,
					skippedErrors: (it.skippedErrors as SchemaValidatorSkippedErrors[]) ?? undefined,
				}
			}
			if (it.type === MigrationType.Schema) {
				if (!it.schemaMigration) {
					throw new UserInputError('schemaMigration must be defined for SCHEMA type')
				}
				return {
					type: 'schema',
					name: it.name,
					version: it.version,
					...(it.schemaMigration as Omit<Migration, 'name' | 'version'>),
				}
			}
			if (it.type === MigrationType.Content) {
				if (!it.contentMigration) {
					throw new UserInputError('contentMigration must be defined for CONTENT type')
				}
				return {
					type: 'content',
					name: it.name,
					version: it.version,
					queries: it.contentMigration.map(it => ({
						query: it.query,
						stage: it.stage ?? undefined,
						variables: it.variables ?? undefined,
					})),
				}
			}
			return assertNever(it.type)
		})
	}
}
