import { Command, CommandConfiguration } from '@contember/cli-common'
import { emptySchema } from '@contember/schema-utils'
import { SchemaLoader } from '../../lib/schema/SchemaLoader'
import { validateSchemaAndPrintErrors } from '../../lib/schema/SchemaValidationHelper'
import { MigrationsValidator } from '../../lib/migrations/MigrationsValidator'
import { MigrationsResolver, SchemaVersionBuilder } from '@contember/migrations-client'
import { SchemaDiffer } from '@contember/schema-migrations'

type Args = {}

type Options = {}

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

	protected async execute(): Promise<number> {
		let projectValid = true

		const migrations = await this.migrationsResolver.getSchemaMigrations()
		projectValid = this.migrationValidator.validate(emptySchema, migrations)
			&& projectValid

		const schema = await this.schemaLoader.loadSchema()
		projectValid = validateSchemaAndPrintErrors(schema, 'Defined schema is invalid:')
			&& projectValid

		const builtSchema = await this.schemaVersionBuilder.buildSchema()
		projectValid = validateSchemaAndPrintErrors(builtSchema, 'Schema built from migrations is invalid:')
			&& projectValid

		if (projectValid) {
			const diff = await this.schemaDiffer.diffSchemas(builtSchema, schema)
			if (diff.length > 0) {
				console.log('Migrations are not in sync with a defined schema')
				projectValid = false
			}
		}

		if (projectValid) {
			console.log('Project schema is valid')
		}

		return projectValid ? 0 : 1
	}
}
