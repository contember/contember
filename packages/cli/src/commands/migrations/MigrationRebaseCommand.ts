import { Command, CommandConfiguration, Input } from '../../cli'
import { MigrationVersionHelper } from '@contember/schema-migrations'
import { executeCreateMigrationCommand } from './MigrationCreateHelper'
import { getMigrationByName } from '../../utils/migrations'
import { resolveLocalSystemApiClient } from './SystemApiClientResolver'
import { emptySchema } from '@contember/schema-utils'
import { validateMigrations } from './MigrationValidationHelper'

type Args = {
	project: string
	migration: string[]
}

type Options = {
	instance?: string
	yes?: true
}

export class MigrationRebaseCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Rebase migrations on filesystem and in local instance')
		configuration.argument('project')
		configuration.argument('migration').variadic()
		configuration //
			.option('instance')
			.valueRequired()
			.description('Local instance name')
		configuration //
			.option('yes')
			.valueNone()
			.description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		return await executeCreateMigrationCommand(
			input,
			async ({
				schemaVersionBuilder,
				migrationsResolver,
				workspace,
				project,
				migrationCreator,
				migrationDescriber,
				schemaMigrator,
				migrationFilesManager,
			}) => {
				const migrationNames = input.getArgument('migration')
				const migrations = []
				for (const migrationName of migrationNames) {
					const migration = await getMigrationByName(migrationsResolver, migrationName)
					if (!migration) {
						throw `Migration ${migrationName} not found`
					}
					migrations.push(migration)
				}
				console.log('Rebasing: ' + migrations.map(it => it.name).join(', '))
				const versions = migrations.map(it => it.version)
				const schemaWithoutMigrations = await schemaVersionBuilder.buildSchemaAdvanced(
					emptySchema,
					version => !versions.includes(version),
				)
				const valid = await validateMigrations(schemaWithoutMigrations, migrations, migrationDescriber, schemaMigrator)
				if (!valid) {
					throw `Cannot rebase migrations`
				}
				const client = await resolveLocalSystemApiClient(workspace, project, input)
				let i = 0
				for (const migration of migrations) {
					const name = migration.name.substring(MigrationVersionHelper.prefixLength + 1)
					const [version, fullName] = MigrationVersionHelper.createVersion(name, i++)
					const newMigration = {
						name: fullName,
						version: version,
						formatVersion: migration.formatVersion,
						modifications: migration.modifications,
					}
					await client.migrationModify(migration.version, newMigration)
					await migrationFilesManager.moveFile(migration.name, newMigration.name)
				}
				console.log('Done')

				return 0
			},
		)
	}
}
