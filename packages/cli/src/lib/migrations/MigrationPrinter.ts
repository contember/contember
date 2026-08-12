/// <reference path="../../../types/chalk-table/index.d.ts" />

import { Schema } from '@contember/schema'
import chalk from 'chalk'
import { AnyMigrationStatus, Migration, MigrationDescriber, MigrationState } from '@contember/migrations-client'
import { emptyDatabaseMetadata } from '@contember/database'
import chalkTable from 'chalk-table'
import { escapeTerminalText, Output } from '@contember/cli-common'
import { assertNever } from '../assertNever.js'

export interface MigrationDescriptionItem {
	modification: string
	description: string
	isDestructive: boolean
	failureWarning: string | null
	sql: string
}

export interface MigrationStatusRow {
	status: string
	migration: string
	info: string
}

export const migrationStatusColumns: { field: keyof MigrationStatusRow & string; name: string }[] = [
	{ field: 'status', name: 'Status' },
	{ field: 'migration', name: 'Migration' },
	{ field: 'info', name: 'Info' },
]

export class MigrationPrinter {
	constructor(
		private readonly migrationsDescriber: MigrationDescriber,
		private readonly output: Output = new Output(),
	) {
	}

	/** The structured description of a migration — the data behind `migrations describe`. */
	describeMigration = (schema: Schema, migration: Migration): MigrationDescriptionItem[] => {
		return this.migrationsDescriber.describeModifications(schema, migration).map(({ modification, getSql, description }) => ({
			modification: modification.modification,
			description: description.message,
			isDestructive: description.isDestructive ?? false,
			failureWarning: description.failureWarning ?? null,
			sql: getSql({
				systemSchema: 'system',
				databaseMetadata: emptyDatabaseMetadata,
				invalidateDatabaseMetadata: () => null,
			}),
		}))
	}

	formatMigrationDescription = (items: MigrationDescriptionItem[], options: { sqlOnly?: boolean; noSql?: boolean } = {}): string => {
		if (options.sqlOnly) {
			return items.map(it => sanitizeMultiline(it.sql.trim())).filter(it => it !== '').join('\n')
		}
		return items.map(item => {
			const color = item.isDestructive ? chalk.red : chalk.blue
			const lines = [color(`${sanitizeMultiline(item.description)} [${sanitizeMultiline(item.modification)}]`)]
			if (item.failureWarning) {
				lines.push(chalk.bgWhite(chalk.redBright(sanitizeMultiline(item.failureWarning))))
			}
			if (!options.noSql) {
				lines.push(item.sql.trim() ? sanitizeMultiline(item.sql) : 'No sql to execute')
			}
			// the body is indented under its header, as console.group used to render it
			return lines.map((line, index) => index === 0 ? line : indent(line)).join('\n')
		}).join('\n')
	}

	/** Prints the description as a diagnostic — a preamble of what a command is about to do. */
	printMigrationDescription = (
		schema: Schema,
		migration: Migration,
		options: { sqlOnly?: boolean; noSql?: boolean },
	) => {
		const description = this.formatMigrationDescription(this.describeMigration(schema, migration), options)
		if (description !== '') {
			for (const line of description.split('\n')) {
				this.output.info(line)
			}
		}
	}

	statusRows = (migrations: AnyMigrationStatus[]): MigrationStatusRow[] => {
		return migrations.map((it): MigrationStatusRow => {
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
					return assertNever(it)
			}
		})
	}

	formatStatusTable = (migrations: AnyMigrationStatus[]): string => {
		return chalkTable({ columns: migrationStatusColumns }, this.statusRows(migrations))
	}
}

const indent = (text: string): string => text.split('\n').map(line => `  ${line}`).join('\n')
const sanitizeMultiline = (text: string): string => text.split('\n').map(escapeTerminalText).join('\n')
