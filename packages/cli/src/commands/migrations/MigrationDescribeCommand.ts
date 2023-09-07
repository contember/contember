import { Command, CommandConfiguration, Input, Workspace } from '@contember/cli-common'
import { MigrationsContainerFactory } from '../../utils/migrations/MigrationsContainer'
import { getLatestMigration, getMigrationByName, printMigrationDescription } from '../../utils/migrations/migrations'

type Args = {
	project?: string
	migration?: string
}

type Options = {
	['sql-only']: boolean
	['no-sql']: boolean
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
		printMigrationDescription(container.migrationDescriber, schema, migration, { sqlOnly, noSql })
	}
}
