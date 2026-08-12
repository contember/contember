import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { MigrationPrinter } from '../../lib/migrations/MigrationPrinter.js'
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

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const migrationArg = input.getArgument('migration')
		const sqlOnly = input.getOption('sql-only')
		const noSql = input.getOption('no-sql')

		const migration = migrationArg
			? await this.migrationsResolver.findSchemaMigrationByVersion(migrationArg)
			: await this.migrationsResolver.findLatestSchemaMigration()

		if (!migration) {
			throw new CliError('Undefined migration', { code: 'MIGRATION_NOT_FOUND', exitCode: ExitCode.NotFound })
		}
		const schema = await this.schemaVersionBuilder.buildSchemaUntil(migration.version)
		// the description is what the user asked for, so it is data: structured with --json, formatted for a human otherwise
		const description = this.migrationPrinter.describeMigration(schema, migration)
		output.data(description, {
			human: it => this.migrationPrinter.formatMigrationDescription(it, { sqlOnly, noSql }),
			quiet: () => migration.version,
		})
	}
}
