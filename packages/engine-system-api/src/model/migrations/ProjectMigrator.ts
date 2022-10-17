import { calculateMigrationChecksum, Migration, MigrationDescriber } from '@contember/schema-migrations'
import { Client, QueryError, wrapIdentifier } from '@contember/database'
import { Schema } from '@contember/schema'
import { SaveMigrationCommand } from '../commands'
import { Stage } from '../dtos'
import { DatabaseContext } from '../database'
import { ExecutedMigrationsResolver } from './ExecutedMigrationsResolver'
import { MigrateErrorCode } from '../../schema'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import { SchemaValidator } from '@contember/schema-utils'
import { logger } from '@contember/logger'

export class ProjectMigrator {
	constructor(
		private readonly migrationDescriber: MigrationDescriber,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
	) {}

	public async migrate(
		db: DatabaseContext,
		stages: Stage[],
		migrationsToExecute: readonly Migration[],
		{ ignoreOrder = false, skipExecuted = false }: {
			ignoreOrder?: boolean
			skipExecuted?: boolean
		},
	) {
		if (migrationsToExecute.length === 0) {
			return
		}
		let { version, notNormalized, id, ...schema }  = await this.schemaVersionBuilder.buildSchema(db)
		const validated = await this.validateMigrations(db, schema, version, migrationsToExecute, { ignoreOrder, skipExecuted })

		const sorted = [...validated].sort((a, b) => a.version.localeCompare(b.version))

		for (const migration of sorted) {
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
				)
			}
			await db.commandBus.execute(new SaveMigrationCommand(migration))
		}
	}

	private async validateMigrations(
		db: DatabaseContext,
		schema: Schema,
		version: string,
		migrationsToExecute: readonly Migration[],
		{ ignoreOrder, skipExecuted }: {
			ignoreOrder: boolean
			skipExecuted: boolean
		},
	): Promise<readonly Migration[]> {
		const executedMigrations = await this.executedMigrationsResolver.getMigrations(db)
		const toExecute = []
		for (const migration of migrationsToExecute) {
			const executedMigration = executedMigrations.find(it => it.version === migration.version)
			if (executedMigration) {
				if (skipExecuted && executedMigration.checksum === calculateMigrationChecksum(migration)) {
					continue
				} else {
					throw new AlreadyExecutedMigrationError(migration.version, `Migration is already executed`)
				}
			}
			if (migration.version < version && !ignoreOrder) {
				throw new MustFollowLatestMigrationError(migration.version, `Must follow latest executed migration ${version}`)
			}
			const described = await this.migrationDescriber.describeModifications(schema, migration, 'system') // system schema name not important here
			if (described.length === 0) {
				continue
			}
			const latestModification = described[described.length - 1]
			schema = latestModification.schema
			const errors = SchemaValidator.validate(schema)
			if (errors.length > 0) {
				throw new InvalidSchemaError(
					migration.version,
					'Migration generates invalid schema: \n' +
					errors.map(it => it.path.join('.') + ': ' + it.message).join('\n'),
				)
			}
			toExecute.push(migration)
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
	): Promise<[Schema]> {
		const {
			sql,
			schema: newSchema,
			handler,
		} = await this.migrationDescriber.describeModification(schema, modification, { systemSchema, formatVersion })
		for (const stage of stages) {
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
