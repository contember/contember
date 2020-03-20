import { Migration, MigrationDescriber, MigrationsResolver, MigrationVersionHelper } from '@contember/schema-migrations'
import chalk from 'chalk'
import { Schema } from '@contember/schema'

export const getLatestMigration = async (migrationsResolver: MigrationsResolver): Promise<Migration | null> => {
	const migrations = await migrationsResolver.getMigrations()
	return migrations.length > 0 ? migrations[migrations.length - 1] : null
}
export const getMigrationByName = async (
	migrationsResolver: MigrationsResolver,
	version: string,
): Promise<Migration | null> => {
	const migrations = await migrationsResolver.getMigrations()
	return (
		migrations.find(
			it => MigrationVersionHelper.extractVersion(it.version) === MigrationVersionHelper.extractVersion(version),
		) || null
	)
}

export const printMigrationDescription = async function(
	migrationsDescriber: MigrationDescriber,
	schema: Schema,
	migration: Migration,
	options: { sqlOnly?: boolean; noSql?: boolean },
) {
	const description = await migrationsDescriber.describeModifications(schema, migration)
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
					'No sql to execute'
				}
			}
			console.groupEnd()
		}
	})
}
