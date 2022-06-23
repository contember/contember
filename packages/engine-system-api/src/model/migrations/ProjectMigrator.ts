import { Migration, MigrationDescriber } from '@contember/schema-migrations'
import { Client, QueryError, wrapIdentifier } from '@contember/database'
import { formatSchemaName } from '../helpers/index.js'
import { Schema } from '@contember/schema'
import { SaveMigrationCommand } from '../commands/index.js'
import { Stage } from '../dtos/index.js'
import { DatabaseContext } from '../database/index.js'
import { ExecutedMigrationsResolver } from './ExecutedMigrationsResolver.js'
import { MigrateErrorCode } from '../../schema/index.js'
import { SchemaVersionBuilder } from './SchemaVersionBuilder.js'
import { SchemaValidator } from '@contember/schema-utils'

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
		logger: (message: string) => void,
		ignoreOrder: boolean = false,
	) {
		if (migrationsToExecute.length === 0) {
			return
		}
		let { version, notNormalized, ...schema }  = await this.schemaVersionBuilder.buildSchema(db)
		await this.validateMigrations(db, schema, version, migrationsToExecute, ignoreOrder)

		const sorted = [...migrationsToExecute].sort((a, b) => a.version.localeCompare(b.version))

		for (const migration of sorted) {
			logger(`Executing migration ${migration.name}...`)
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
			logger(`Done`)
		}

		logger(`Done`)
	}

	private async validateMigrations(
		db: DatabaseContext,
		schema: Schema,
		version: string,
		migrationsToExecute: readonly Migration[],
		ignoreOrder: boolean = false,
	) {
		const executedMigrations = await this.executedMigrationsResolver.getMigrations(db)
		for (const migration of migrationsToExecute) {
			if (executedMigrations.find(it => it.version === migration.version)) {
				throw new AlreadyExecutedMigrationError(migration.version, `Migration is already executed`)
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
		}
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
				// eslint-disable-next-line no-console
				console.error(e)
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
