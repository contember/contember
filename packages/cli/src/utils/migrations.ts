import {
	calculateMigrationChecksum,
	Migration,
	MigrationDescriber,
	MigrationInfo,
	MigrationsResolver,
	MigrationVersionHelper,
} from '@contember/schema-migrations'
import chalk from 'chalk'
import { Schema } from '@contember/schema'
import chalkTable from 'chalk-table'
import { assertNever } from './assertNever.js'

export const getLatestMigration = async (migrationsResolver: MigrationsResolver): Promise<Migration | null> => {
	const migrations = await migrationsResolver.getMigrations()
	return migrations.length > 0 ? migrations[migrations.length - 1] : null
}
export const getMigrationByName = async (
	migrationsResolver: MigrationsResolver,
	version: string,
): Promise<Migration | null> => {
	const migrations = await migrationsResolver.getMigrations()
	return findMigration(migrations, version)
}

export const findMigration = <M extends { version: string }>(migrations: M[], version: string): M | null =>
	migrations.find(
		it => MigrationVersionHelper.extractVersion(it.version) === MigrationVersionHelper.extractVersion(version),
	) || null

export const printMigrationDescription = async function (
	migrationsDescriber: MigrationDescriber,
	schema: Schema,
	migration: Migration,
	options: { sqlOnly?: boolean; noSql?: boolean },
) {
	const description = await migrationsDescriber.describeModifications(schema, migration, 'system') // schema name cannot be determined
	description.forEach(({ modification, sql, description }) => {
		if (options.sqlOnly) {
			console.log(sql)
		} else {
			const color = description.isDestructive ? chalk.red : chalk.blue
			console.group(color(`${description.message} [${modification.modification}]`))
			if (description.failureWarning) {
				console.log(chalk.bgWhite(chalk.redBright(description.failureWarning)))
			}

			if (!options.noSql) {
				if (sql.trim()) {
					console.log(sql)
				} else {
					console.log('No sql to execute')
				}
			}
			console.groupEnd()
		}
	})
}

export interface ExecutedMigrationInfo extends MigrationInfo {
	readonly executedAt: Date
	readonly checksum: string
}

export interface ExecutedMigration extends Migration {
	readonly executedAt: Date
	readonly checksum: string
}

export enum MigrationState {
	TO_EXECUTE_OK = 'to_execute_ok',
	TO_EXECUTE_ERROR = 'to_execute_error',
	EXECUTED_OK = 'executed_ok',
	EXECUTED_ERROR = 'executed_error',
	EXECUTED_MISSING = 'executed_missing',
}

export interface MigrationToExecuteOkStatus extends MigrationInfo {
	state: MigrationState.TO_EXECUTE_OK
	localMigration: Migration
}

interface MigrationToExecuteInvalidStatus extends MigrationInfo {
	state: MigrationState.TO_EXECUTE_ERROR
	localMigration: Migration
	errorMessage: string
}

interface MigrationExecutedOkStatus extends MigrationInfo {
	state: MigrationState.EXECUTED_OK
	executedMigration: ExecutedMigrationInfo
	localMigration: Migration
}

interface MigrationExecutedMissingStatus extends MigrationInfo {
	state: MigrationState.EXECUTED_MISSING
	executedMigration: ExecutedMigrationInfo
	errorMessage: string
}

interface MigrationExecutedErrorStatus extends MigrationInfo {
	state: MigrationState.EXECUTED_ERROR
	executedMigration: ExecutedMigrationInfo
	localMigration: Migration
	errorMessage: string
}

export type ErrorMigrationStatus =
	| MigrationToExecuteInvalidStatus
	| MigrationExecutedMissingStatus
	| MigrationExecutedErrorStatus

export type AnyMigrationStatus = ErrorMigrationStatus | MigrationToExecuteOkStatus | MigrationExecutedOkStatus
export const isErrorMigrationStatus = (migration: AnyMigrationStatus): migration is ErrorMigrationStatus =>
	[MigrationState.EXECUTED_ERROR, MigrationState.EXECUTED_MISSING, MigrationState.TO_EXECUTE_ERROR].includes(
		migration.state,
	)

export const sortMigrations = <M extends { version: string }>(migrations: M[]): M[] => {
	return [...migrations].sort((a, b) => a.version.localeCompare(b.version))
}

export const getMigrationsStatus = (
	executedMigrations: ExecutedMigrationInfo[],
	localMigrations: Migration[],
	force: boolean = false,
): {
	allMigrations: AnyMigrationStatus[]
	errorMigrations: ErrorMigrationStatus[]
	migrationsToExecute: MigrationToExecuteOkStatus[]
} => {
	const sortedExecuted = sortMigrations(executedMigrations)

	const allMigrations: AnyMigrationStatus[] = []
	for (const executed of sortedExecuted) {
		const localMigration = localMigrations.find(it => it.version === executed.version)
		if (!localMigration) {
			allMigrations.push({
				state: MigrationState.EXECUTED_MISSING,
				executedMigration: executed,
				formatVersion: executed.formatVersion,
				name: executed.name,
				version: executed.version,
				errorMessage: `Migration ${executed.name} is missing locally`,
			})
			continue
		}
		const localChecksum = calculateMigrationChecksum(localMigration)
		if (localChecksum !== executed.checksum) {
			allMigrations.push({
				state: MigrationState.EXECUTED_ERROR,
				executedMigration: executed,
				localMigration,
				formatVersion: executed.formatVersion,
				name: executed.name,
				version: executed.version,
				errorMessage: `Checksum of executed migration "${executed.checksum}" does not match "${localChecksum}"`,
			})
			continue
		}
		allMigrations.push({
			state: MigrationState.EXECUTED_OK,
			executedMigration: executed,
			localMigration,
			formatVersion: executed.formatVersion,
			name: executed.name,
			version: executed.version,
		})
	}

	const latestExecuted = sortedExecuted.length > 0 ? sortedExecuted[sortedExecuted.length - 1] : null
	for (const localMigration of localMigrations) {
		if (allMigrations.find(it => it.version === localMigration.version)) {
			continue
		}

		if (latestExecuted && latestExecuted.version > localMigration.version) {
			allMigrations.push({
				state: MigrationState.TO_EXECUTE_ERROR,
				localMigration,
				formatVersion: localMigration.formatVersion,
				name: localMigration.name,
				version: localMigration.version,
				errorMessage: `Must follow latest executed migration ${latestExecuted.name}`,
			})
			continue
		}
		allMigrations.push({
			state: MigrationState.TO_EXECUTE_OK,
			localMigration,
			formatVersion: localMigration.formatVersion,
			name: localMigration.name,
			version: localMigration.version,
		})
	}
	const allMigrationsSorted = sortMigrations(allMigrations)

	return {
		allMigrations: allMigrationsSorted,
		errorMigrations: allMigrationsSorted.filter(isErrorMigrationStatus),
		migrationsToExecute: allMigrationsSorted.filter(
			(it): it is MigrationToExecuteOkStatus =>
				it.state === MigrationState.TO_EXECUTE_OK || (force && it.state === MigrationState.TO_EXECUTE_ERROR),
		),
	}
}
export const createMigrationStatusTable = (migrations: AnyMigrationStatus[]): string => {
	return chalkTable(
		{
			columns: ['status', 'migration', 'info'],
		},
		migrations.map(it => {
			switch (it.state) {
				case MigrationState.EXECUTED_ERROR:
					return { status: chalk.bgRedBright.white('ERROR'), migration: it.name, info: it.errorMessage }
				case MigrationState.EXECUTED_OK:
					return {
						status: chalk.bgGreen.blackBright('Executed'),
						migration: it.name,
						info: `Executed at ${it.executedMigration.executedAt.toISOString()}`,
					}
				case MigrationState.EXECUTED_MISSING:
					return {
						status: chalk.bgRedBright.white('ERROR'),
						migration: it.name,
						info: it.errorMessage,
					}
				case MigrationState.TO_EXECUTE_OK:
					return {
						status: chalk.bgBlueBright.white('Not executed'),
						migration: it.name,
						info: 'Will be executed during next deploy',
					}
				case MigrationState.TO_EXECUTE_ERROR:
					return { status: chalk.bgRedBright.white('ERROR'), migration: it.name, info: it.errorMessage }
				default:
					assertNever(it)
			}
		}),
	)
}
