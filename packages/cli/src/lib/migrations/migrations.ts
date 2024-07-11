import { Migration, MigrationDescriber } from '@contember/schema-migrations'
import chalk from 'chalk'
import { Schema } from '@contember/schema'
import chalkTable from 'chalk-table'
import { assertNever } from '../assertNever'
import { emptyDatabaseMetadata } from '@contember/database'
import { MigrationState } from '@contember/migrations-client'
import { AnyMigrationStatus } from '@contember/migrations-client'


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
