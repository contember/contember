import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { MigrationPrinter } from '../../lib/migrations/MigrationPrinter'
import { MigrationsResolver, SchemaVersionBuilder } from '@contember/migrations-client'

type Args = {
	migration?: string
}

type Options = {
	['sql-only']: boolean
	['no-sql']: boolean
}


export class MigrationDescribeCommand extends Command<Args, Options> {
	constructor(
		private readonly migrationPrinter: MigrationPrinter,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly migrationsResolver: MigrationsResolver,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Describes a migration')
		configuration.argument('migration').optional()
		configuration.option('sql-only').valueNone()
		configuration.option('no-sql').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const migrationArg = input.getArgument('migration')
		const sqlOnly = input.getOption('sql-only')
		const noSql = input.getOption('no-sql')

		const migration = migrationArg
			? await this.migrationsResolver.findSchemaMigrationByVersion(migrationArg)
			: await this.migrationsResolver.findLatestSchemaMigration()

		if (!migration) {
			throw 'Undefined migration'
		}
		const schema = await this.schemaVersionBuilder.buildSchemaUntil(migration.version)
		this.migrationPrinter.printMigrationDescription(schema, migration, { sqlOnly, noSql })
	}
}
