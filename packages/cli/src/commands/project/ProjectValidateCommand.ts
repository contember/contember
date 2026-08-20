import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { emptySchema, SchemaValidator } from '@contember/schema-utils'
import { MigrationsValidator } from '../../lib/migrations/MigrationsValidator.js'
import { MigrationsResolver, SchemaVersionBuilder } from '@contember/migrations-client'
import { SchemaDiffer } from '@contember/schema-migrations'
import { SchemaLoader } from '../../lib/schema/SchemaLoader.js'

type Args = {}

type Options = {}

type ValidationIssue = {
	source: 'schema' | 'built-schema' | 'migrations' | 'diff'
	path: string
	code: string
	message: string
}

export class ProjectValidateCommand extends Command<Args, Options> {
	constructor(
		private readonly schemaLoader: SchemaLoader,
		private readonly migrationValidator: MigrationsValidator,
		private readonly migrationsResolver: MigrationsResolver,
		private readonly schemaDiffer: SchemaDiffer,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Validates project schema')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const issues: ValidationIssue[] = []

		// prints its own itemized diagnostics per offending migration; here we only need the pass/fail
		const migrations = await this.migrationsResolver.getSchemaMigrations()
		if (!this.migrationValidator.validate(emptySchema, migrations)) {
			issues.push({
				source: 'migrations',
				path: '',
				code: 'MIGRATIONS_INVALID_SCHEMA',
				message: 'One or more migrations produce an invalid schema; see the diagnostics above for details',
			})
		}

		const schema = await this.schemaLoader.loadSchema()
		for (const err of SchemaValidator.validate(schema)) {
			issues.push({ source: 'schema', path: err.path.join('.'), code: err.code, message: err.message })
		}

		const builtSchema = await this.schemaVersionBuilder.buildSchema()
		for (const err of SchemaValidator.validate(builtSchema)) {
			issues.push({ source: 'built-schema', path: err.path.join('.'), code: err.code, message: err.message })
		}

		// comparing an already-invalid schema against migrations is meaningless — only diff once both sides are valid
		if (issues.length === 0) {
			const diff = await this.schemaDiffer.diffSchemas(builtSchema, schema)
			if (diff.length > 0) {
				issues.push({
					source: 'diff',
					path: '',
					code: 'SCHEMA_MIGRATIONS_DIFF',
					message: 'Migrations are not in sync with the defined schema',
				})
			}
		}

		const columns: { field: keyof ValidationIssue & string; name: string }[] = [
			{ field: 'source', name: 'Source' },
			{ field: 'path', name: 'Path' },
			{ field: 'code', name: 'Code' },
			{ field: 'message', name: 'Message' },
		]
		if (issues.length > 0) {
			if (!output.isJson && !output.isQuiet) {
				output.table(columns, issues, 'message')
			}
			throw new CliError(`Project schema is invalid: found ${issues.length} issue(s)`, {
				code: 'SCHEMA_INVALID',
				exitCode: ExitCode.InputError,
				details: issues,
			})
		}

		output.table(columns, issues, 'message')
		output.info('Project schema is valid')
	}
}
