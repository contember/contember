import { Command, CommandConfiguration, Input } from '../../cli'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { getProjectDirectories } from '../../NamingHelper'
import { getLatestMigration, getMigrationByName } from '../../utils/migrations'
import chalk from 'chalk'
import { Migration, MigrationDescriber } from '@contember/schema-migrations'
import { Schema } from '@contember/schema'

type Args = {
	project: string
	migration?: string
}

type Options = {
	['sql-only']: boolean
	['no-sql']: boolean
}

let printMigrationDescription = async function (
	migrationsDescriber: MigrationDescriber,
	schema: Schema,
	migration: Migration,
	options: { sqlOnly: boolean; noSql: boolean },
) {
	const description = await migrationsDescriber.describeModifications(schema, migration)
	description.forEach(({ modification, sql, description }) => {
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

export class MigrationDescribeCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Describes a migration')
		configuration.argument('project')
		configuration.argument('migration').optional()
		configuration.option('sql-only').valueNone()
		configuration.option('no-sql').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const projectName = input.getArgument('project')

		const { migrationsDir } = getProjectDirectories(projectName)
		const container = new MigrationsContainerFactory(migrationsDir).create()

		const migrationArg = input.getArgument('migration')
		const migrationsResolver = container.migrationsResolver
		const migration = await (migrationArg
			? getMigrationByName(migrationsResolver, migrationArg)
			: getLatestMigration(migrationsResolver))
		if (!migration) {
			throw 'Undefined migration'
		}
		const schema = await container.schemaVersionBuilder.buildSchemaUntil(migration.version)
		const sqlOnly = input.getOption('sql-only')
		const noSql = input.getOption('no-sql')
		await printMigrationDescription(container.migrationsDescriber, schema, migration, { sqlOnly, noSql })
	}
}
