import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { getLatestMigration, getMigrationByName } from '../../utils/migrations'
import chalk from 'chalk'
import { Migration, MigrationDescriber } from '@contember/schema-migrations'
import { Schema } from '@contember/schema'
import { Workspace } from '@contember/cli-common'

type Args = {
	project?: string
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
	const description = await migrationsDescriber.describeModifications(schema, migration, 'system') // schema name cannot be determined here
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
	constructor(
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Describes a migration')
		if (!this.workspace.isSingleProjectMode()) {
			configuration.argument('project')
		}
		configuration.argument('migration').optional()
		configuration.option('sql-only').valueNone()
		configuration.option('no-sql').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const projectName = input.getArgument('project')

		const workspace = this.workspace
		const project = await workspace.projects.getProject(projectName, { fuzzy: true })
		const migrationsDir = await project.migrationsDir
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
		await printMigrationDescription(container.migrationDescriber, schema, migration, { sqlOnly, noSql })
	}
}
