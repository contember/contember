import { Migration, MigrationDescriber } from '@contember/schema-migrations'
import chalk from 'chalk'
import { Schema } from '@contember/schema'
import chalkTable from 'chalk-table'
import { assertNever } from '../assertNever'
import { emptyDatabaseMetadata } from '@contember/database'
import { MigrationState } from '@contember/migrations-client'
import { AnyMigrationStatus } from '@contember/migrations-client'

export const printMigrationDescription = function (
	migrationsDescriber: MigrationDescriber,
	schema: Schema,
	migration: Migration,
	options: { sqlOnly?: boolean; noSql?: boolean },
) {
	const description = migrationsDescriber.describeModifications(schema, migration)
	description.forEach(({ modification, getSql, description }) => {
		const sql = getSql({
			systemSchema: 'system',
			databaseMetadata: emptyDatabaseMetadata,
			invalidateDatabaseMetadata: () => null,
		})
		if (options.sqlOnly) {
			if (sql.trim()) {
				console.log(sql)
			}
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
