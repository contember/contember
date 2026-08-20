import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { Migration, MigrationsResolver } from '@contember/migrations-client'
import { MigrationRebaseFacade } from '../../lib/migrations/MigrationRebaseFacade.js'
import { promptConfirm } from '../../lib/prompt/index.js'

type MigrationRebaser = Pick<MigrationRebaseFacade, 'rebase'>

type Args = {
	migration: string[]
}

type Options = {
	yes?: true
}

export class MigrationRebaseCommand extends Command<Args, Options> {
	constructor(
		private readonly migrationsResolver: MigrationsResolver,
		private readonly migrationRebaseFacade: MigrationRebaser,
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

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const migrationNames = input.getArgument('migration')

		const migrations: Migration[] = []
		for (const migrationName of migrationNames) {
			const migration = await this.migrationsResolver.findSchemaMigrationByVersion(migrationName)
			if (!migration) {
				throw new CliError(`Migration ${migrationName} not found`, { code: 'MIGRATION_NOT_FOUND', exitCode: ExitCode.NotFound })
			}
			migrations.push(migration)
		}

		output.info('Rebasing: ' + migrations.map(it => it.name).join(', '))
		if (!input.getOption('yes')) {
			if (!output.canPrompt()) {
				throw new CliError('TTY not available. Pass --yes to confirm rebasing.', {
					code: 'TTY_UNAVAILABLE',
					exitCode: ExitCode.InputError,
				})
			}
			const confirmed = await promptConfirm(output, {
				message: 'Rewrite these migrations?',
				initial: false,
			})
			if (!confirmed) {
				throw new CliError('Migration rebase aborted', { code: 'OPERATION_ABORTED', exitCode: ExitCode.InputError })
			}
		}
		await this.migrationRebaseFacade.rebase(migrations)
		const result = { migrations: migrations.map(it => it.name), count: migrations.length }
		output.data(result, {
			human: value => `Rebased ${value.count} migration(s)`,
			quiet: value => value.migrations,
		})
	}
}
