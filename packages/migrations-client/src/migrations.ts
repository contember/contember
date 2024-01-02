import { calculateMigrationChecksum, Migration, MigrationInfo } from '@contember/schema-migrations'
import { isSchemaMigration, MigrationFile } from './MigrationFile'

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

export interface MigrationStatusBase<S extends MigrationState> {
	state: S
	version: string
	name: string
}

export interface MigrationToExecuteOkStatus extends MigrationStatusBase<MigrationState.TO_EXECUTE_OK> {
	localMigration: MigrationFile
}

interface MigrationToExecuteInvalidStatus extends MigrationStatusBase<MigrationState.TO_EXECUTE_ERROR> {
	localMigration: MigrationFile
	errorMessage: string
}

interface MigrationExecutedOkStatus extends MigrationStatusBase<MigrationState.EXECUTED_OK>{
	executedMigration: ExecutedMigrationInfo
	localMigration: MigrationFile
}

interface MigrationExecutedMissingStatus extends MigrationStatusBase<MigrationState.EXECUTED_MISSING>{
	executedMigration: ExecutedMigrationInfo
	errorMessage: string
}

interface MigrationExecutedErrorStatus extends MigrationStatusBase<MigrationState.EXECUTED_ERROR>{
	executedMigration: ExecutedMigrationInfo
	localMigration: MigrationFile
	errorMessage: string
}

export type ErrorMigrationStatus =
	| MigrationToExecuteInvalidStatus
	| MigrationExecutedMissingStatus
	| MigrationExecutedErrorStatus

export type AnyMigrationStatus =
	| ErrorMigrationStatus
	| MigrationToExecuteOkStatus
	| MigrationExecutedOkStatus

const isErrorMigrationStatus = (migration: AnyMigrationStatus): migration is ErrorMigrationStatus =>
	[MigrationState.EXECUTED_ERROR, MigrationState.EXECUTED_MISSING, MigrationState.TO_EXECUTE_ERROR].includes(
		migration.state,
	)

export const sortMigrations = <M extends { version: string }>(migrations: M[]): M[] => {
	return [...migrations].sort((a, b) => a.version.localeCompare(b.version))
}

export class MigrationsStatusResolver {

	async getMigrationsStatus(
		executedMigrations: ExecutedMigrationInfo[],
		localMigrations: MigrationFile[],
		force: boolean = false,
	): Promise<{
		allMigrations: AnyMigrationStatus[]
		errorMigrations: ErrorMigrationStatus[]
		migrationsToExecute: MigrationToExecuteOkStatus[]
	}> {
		const sortedExecuted = sortMigrations(executedMigrations)

		const allMigrations: AnyMigrationStatus[] = []
		for (const executed of sortedExecuted) {
			const localMigration = localMigrations.find(it => it.version === executed.version)
			if (!localMigration) {
				allMigrations.push({
					state: MigrationState.EXECUTED_MISSING,
					executedMigration: executed,
					version: executed.version,
					name: executed.name,
					errorMessage: `Migration ${executed.name} is missing locally`,
				})
				continue
			}
			const migrationContent = await localMigration.getContent()

			const localChecksum = !isSchemaMigration(migrationContent) ? null : calculateMigrationChecksum(migrationContent)

			if (localChecksum !== executed.checksum) {
				allMigrations.push({
					state: MigrationState.EXECUTED_ERROR,
					executedMigration: executed,
					version: executed.version,
					name: executed.name,
					localMigration,
					errorMessage: `Checksum of executed migration "${executed.checksum}" does not match "${localChecksum}"`,
				})
				continue
			}
			allMigrations.push({
				state: MigrationState.EXECUTED_OK,
				executedMigration: executed,
				version: executed.version,
				name: executed.name,
				localMigration,
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
					version: localMigration.version,
					name: localMigration.name,
					errorMessage: `Must follow latest executed migration ${latestExecuted.name}`,
				})
				continue
			}
			allMigrations.push({
				state: MigrationState.TO_EXECUTE_OK,
				localMigration,
				version: localMigration.version,
				name: localMigration.name,
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

}
