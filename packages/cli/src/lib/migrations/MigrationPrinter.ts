// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../types/chalk-table/index.d.ts" />

import { Schema } from '@contember/schema'
import chalk from 'chalk'
import { AnyMigrationStatus, Migration, MigrationDescriber, MigrationState } from '@contember/migrations-client'
import { emptyDatabaseMetadata } from '@contember/database'
import chalkTable from 'chalk-table'
import { assertNever } from '../assertNever'

export class MigrationPrinter {
	constructor(
		private readonly migrationsDescriber: MigrationDescriber,
	) {
	}

	printMigrationDescription = (
		schema: Schema,
		migration: Migration,
		options: { sqlOnly?: boolean; noSql?: boolean },
	) => {
		const description = this.migrationsDescriber.describeModifications(schema, migration)
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

	printStatusTable = (migrations: AnyMigrationStatus[]) => {
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
					case MigrationState.SKIP_EMPTY:
						return {
							status: chalk.bgYellow.white('Skip'),
							migration: it.name,
							info: `Skipped because empty`,
						}
					default:
						assertNever(it)
				}
			}),
		)
	}

}
