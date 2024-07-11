import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { Migration, MigrationsResolver } from '@contember/migrations-client'
import { MigrationRebaseFacade } from '../../lib/migrations/MigrationRebaseFacade'

type Args = {
	migration: string[]
}

type Options = {
	yes?: true
}

export class MigrationRebaseCommand extends Command<Args, Options> {
	constructor(
		private readonly migrationsResolver: MigrationsResolver,
		private readonly migrationRebaseFacade: MigrationRebaseFacade,
	) {
		super()
	}


	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Rebase migrations on filesystem and in local instance')
		configuration.argument('migration').variadic()
		configuration //
			.option('yes')
			.valueNone()
			.description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {

		const migrationNames = input.getArgument('migration')

		const migrations: Migration[] = []
		for (const migrationName of migrationNames) {
			const migration = await this.migrationsResolver.findSchemaMigrationByVersion(migrationName)
			if (!migration) {
				throw `Migration ${migrationName} not found`
			}
			migrations.push(migration)
		}

		console.log('Rebasing: ' + migrations.map(it => it.name).join(', '))
		await this.migrationRebaseFacade.rebase(migrations)
		console.log('Done')
	}
}
