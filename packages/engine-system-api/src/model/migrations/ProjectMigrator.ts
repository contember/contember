import { calculateMigrationChecksum, Migration, MigrationDescriber, MigrationVersionHelper } from '@contember/schema-migrations'
import { Client, DatabaseMetadata, QueryError, wrapIdentifier } from '@contember/database'
import { Schema } from '@contember/schema'
import { SaveMigrationCommand } from '../commands'
import { Stage } from '../dtos'
import { DatabaseContext } from '../database'
import { ExecutedMigrationsResolver } from './ExecutedMigrationsResolver'
import { MigrateErrorCode } from '../../schema'
import { calculateSchemaChecksum, SchemaValidator, SchemaValidatorSkippedErrors } from '@contember/schema-utils'
import { logger } from '@contember/logger'
import { MigrationsDatabaseMetadataResolverStoreFactory, SchemaDatabaseMetadataResolverStore } from '../metadata'
import { ContentMigrationQuery, MigrationInput } from './MigrationInput'
import { ContentQueryExecutor } from '../dependencies'
import { SchemaProvider } from './SchemaProvider'
import { SaveSchemaCommand } from '../commands/schema/SaveSchemaCommand'
import { ImplementationException } from '../../utils'

export class ProjectMigrator {
	constructor(
		private readonly migrationDescriber: MigrationDescriber,
		private readonly schemaProvider: SchemaProvider,
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
		private readonly migrationsDatabaseMetadataResolverStoreFactory: MigrationsDatabaseMetadataResolverStoreFactory,
		private readonly contentQueryExecutor: ContentQueryExecutor,
	) {}

	public async migrate({ db, project, identity, options: { ignoreOrder = false, skipExecuted = false }, migrationsToExecute, stages }: {
		db: DatabaseContext
		project: { slug: string; systemSchema: string }
		identity: { id: string }
		stages: Stage[]
		migrationsToExecute: readonly MigrationInput[]
		options: {
			ignoreOrder?: boolean
			skipExecuted?: boolean
		}
	}) {
		if (migrationsToExecute.length === 0) {
			return
		}
		const schemaWithMeta = await this.schemaProvider.fetch({ db })
		let schema = schemaWithMeta.schema
		let id = schemaWithMeta.meta.id

		const validated = await this.validateMigrations(db, schema, schemaWithMeta.meta.version ?? null, migrationsToExecute, { ignoreOrder, skipExecuted })
		if (validated.length === 0) {
			return
		}

		const sorted = [...validated].sort((a, b) => a.version.localeCompare(b.version))

		const metadataStore = this.migrationsDatabaseMetadataResolverStoreFactory.create(db)

		for (const migration of sorted) {

			if (migration.type === 'schema') {
				const formatVersion = migration.formatVersion

				for (const modification of migration.modifications) {
					[schema] = await this.applyModification(
						db.client,
						stages,
						schema,
						modification,
						formatVersion,
						migration.version,
						db.client.schema,
						metadataStore,
					)
				}
			} else if (migration.type === 'content') {
				if (!id) {
					throw new FailedContentMigrationError(migration.version, `Cannot execute content migration without schema`)
				}
				for (const query of migration.queries) {
					await this.executeContentMigration({
						version: migration.version,
						query,
						db,
						schema,
						schemaMeta: { id },
						stages,
						databaseMetadata: await metadataStore.getMetadata(db.client.schema),
						identity,
						project,
					})
				}
				// event log uses deferred constraint triggers, we need to fire them before ALTER
				await db.client.query(`SET CONSTRAINTS ALL IMMEDIATE`)
				await db.client.query(`SET CONSTRAINTS ALL DEFERRED`)

			}
			id = await db.commandBus.execute(new SaveMigrationCommand(migration))
		}
		if (!id) {
			throw new ImplementationException()
		}

		await db.commandBus.execute(new SaveSchemaCommand({
			schema,
			meta: {
				id,
				updatedAt: new Date(),
				version: sorted[sorted.length - 1].version,
				checksum: calculateSchemaChecksum(schema),
			},
		}))
	}

	private async executeContentMigration({ query, stages, version, ...ctx }: {
		version: string
		db: DatabaseContext
		query: ContentMigrationQuery
		stages: Stage[]
		schema: Schema
		schemaMeta: { id: number }
		project: { slug: string; systemSchema: string }
		identity: { id: string }
		databaseMetadata: DatabaseMetadata
	}) {
		const queryStages = query.stage ? stages.filter(it => it.slug === query.stage) : stages
		for (const stage of queryStages) {
			const response = await this.contentQueryExecutor.execute({
				stage,
				...ctx,
			}, query)

			if (!response.ok) {
				throw new FailedContentMigrationError(version, response.errors.join(', '))
			}
			if (query.checkMutationResult !== false) {
				for (const [key, value] of Object.entries(response.result.data ?? {})) {
					if (typeof value === 'object' && value !== null && 'ok' in value && !value.ok) {
						const errorDetails = 'errorMessage' in value ? value.errorMessage : 'No details available. Please fetch errorMessage field.'
						throw new NotSuccessfulContentMigrationError(version, `Mutation ${key} failed: ${errorDetails}`)
					}
				}
			}
		}
	}

	private async validateMigrations(
		db: DatabaseContext,
		schema: Schema,
		version: string | null,
		migrationsToExecute: readonly MigrationInput[],
		{ ignoreOrder, skipExecuted }: {
			ignoreOrder: boolean
			skipExecuted: boolean
		},
	): Promise<readonly MigrationInput[]> {
		const executedMigrations = await this.executedMigrationsResolver.getMigrations(db)
		const toExecute: MigrationInput[] = []
		let skippedErrors: SchemaValidatorSkippedErrors[] = []
		for (const migration of migrationsToExecute) {
			const executedMigration = executedMigrations.find(it => it.version === migration.version)
			if (executedMigration) {
				if (skipExecuted && (migration.type !== 'schema' || executedMigration.checksum === calculateMigrationChecksum(migration))) {
					continue
				} else {
					throw new AlreadyExecutedMigrationError(migration.version, `Migration is already executed`)
				}
			}

			if (version && migration.version < version && !ignoreOrder) {
				throw new MustFollowLatestMigrationError(migration.version, `Must follow latest executed migration ${version}`)
			}
			if (migration.type === 'schema') {
				const described = this.migrationDescriber.describeModifications(schema, migration)
				if (described.length === 0) {
					continue
				}
				const latestModification = described[described.length - 1]
				schema = latestModification.schema
				skippedErrors = [
					...skippedErrors.filter(it => it.skipUntil && MigrationVersionHelper.extractVersion(it.skipUntil) >= migration.version),
					...migration.skippedErrors ?? [],
				]
				const errors = SchemaValidator.validate(schema, skippedErrors)
				if (errors.length > 0) {
					throw new InvalidSchemaError(
						migration.version,
						'Migration generates invalid schema: \n' +
						errors.map(it => `${it.path.join('.')}: [${it.code}] ${it.message}`).join('\n'),
					)
				}
			}

			toExecute.push(migration)
		}
		// intentionally not using skippedErrors here
		const errors = SchemaValidator.validate(schema)
		if (errors.length > 0) {
			throw new InvalidSchemaError(
				toExecute[toExecute.length - 1].version,
				'Migration generates invalid schema: \n' +
				errors.map(it => it.path.join('.') + ': ' + it.message).join('\n'),
			)
		}
		return toExecute
	}

	private async applyModification(
		db: Client,
		stages: Stage[],
		schema: Schema,
		modification: Migration.Modification,
		formatVersion: number,
		migrationVersion: string,
		systemSchema: string,
		metadataStore: SchemaDatabaseMetadataResolverStore,
	): Promise<[Schema]> {
		const {
			getSql,
			schema: newSchema,
		} = this.migrationDescriber.describeModification(schema, modification, { formatVersion })
		for (const stage of stages) {
			const databaseMetadata = await metadataStore.getMetadata(stage.schema)
			const sql = getSql({
				systemSchema,
				databaseMetadata,
				invalidateDatabaseMetadata: () => metadataStore.invalidate(stage.schema),
			})
			await this.executeOnStage(db, stage, sql, migrationVersion)
		}
		return [newSchema]
	}

	private async executeOnStage(db: Client, stage: Stage, sql: string, migrationVersion: string) {
		await db.query('SET search_path TO ' + wrapIdentifier(stage.schema))
		try {
			await db.query(sql)
		} catch (e) {
			if (e instanceof QueryError) {
				logger.error(e, { message: 'Migration failed' })
				throw new MigrationFailedError(migrationVersion, e.message)
			}
			throw e
		}
	}
}

export abstract class MigrationError extends Error {
	public abstract code: MigrateErrorCode

	constructor(public readonly version: string, public readonly migrationError: string) {
		super(`${version}: ${migrationError}`)
	}
}

export class MustFollowLatestMigrationError extends MigrationError {
	code = MigrateErrorCode.MustFollowLatest
}

export class AlreadyExecutedMigrationError extends MigrationError {
	code = MigrateErrorCode.AlreadyExecuted
}

export class MigrationFailedError extends MigrationError {
	code = MigrateErrorCode.MigrationFailed
}

export class InvalidSchemaError extends MigrationError {
	code = MigrateErrorCode.InvalidSchema
}

export class FailedContentMigrationError extends MigrationError {
	code = MigrateErrorCode.ContentMigrationFailed
}

export class NotSuccessfulContentMigrationError extends MigrationError {
	code = MigrateErrorCode.ContentMigrationNotSuccessful
}
