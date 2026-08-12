import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { MigrationSnapshotFacade } from '../../lib/migrations/MigrationSnapshotFacade.js'
import { promptConfirm } from '../../lib/prompt/index.js'

type Args = {}

type Options = {
	yes?: true
}

export class MigrationSnapshotCommand extends Command<Args, Options> {
	constructor(
		private readonly migrationSnapshotFacade: MigrationSnapshotFacade,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description(
			'Creates a schema snapshot (snapshot.json) that bootstraps a fresh database in one step instead of replaying every migration',
		)
		configuration.option('yes').valueNone().description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<number> {
		const snapshot = await this.migrationSnapshotFacade.prepare()
		output.info(`Will collapse ${snapshot.covers.length} migrations up to ${snapshot.version} into snapshot.json.`)

		if (snapshot.contentMigrations.length > 0) {
			output.warn('')
			output.warn(`Warning: ${snapshot.contentMigrations.length} content (data) migration(s) are covered by this snapshot:`)
			snapshot.contentMigrations.forEach(version => output.warn(`  - ${version}`))
			output.warn('Their data effects are NOT reproduced when bootstrapping from the snapshot.')
			output.warn('Seed any required data manually for local development.')
		}

		if (!input.getOption('yes')) {
			if (!output.canPrompt()) {
				throw new CliError('TTY not available. Pass --yes to confirm snapshot creation.', {
					code: 'TTY_UNAVAILABLE',
					exitCode: ExitCode.InputError,
				})
			}
			const confirmed = await promptConfirm(output, {
				message: 'Write snapshot.json?',
				initial: false,
			})
			if (!confirmed) {
				throw new CliError('Snapshot creation aborted', {
					code: 'OPERATION_ABORTED',
					exitCode: ExitCode.InputError,
				})
			}
		}

		await this.migrationSnapshotFacade.write(snapshot)
		const result = {
			version: snapshot.version,
			coveredMigrations: snapshot.covers.length,
			contentMigrations: snapshot.contentMigrations,
			path: 'snapshot.json',
		}
		output.data(result, {
			human: value => `Snapshot created: ${value.coveredMigrations} migrations collapsed up to ${value.version}.`,
			quiet: value => value.path,
		})
		return 0
	}
}
