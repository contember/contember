import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { MigrationSnapshotFacade } from '../../lib/migrations/MigrationSnapshotFacade'

type Args = {}

type Options = {}

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
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const snapshot = await this.migrationSnapshotFacade.create()
		console.log(`Snapshot created: ${snapshot.covers.length} migrations collapsed up to ${snapshot.version}.`)

		if (snapshot.contentMigrations.length > 0) {
			console.warn('')
			console.warn(`Warning: ${snapshot.contentMigrations.length} content (data) migration(s) are covered by this snapshot:`)
			snapshot.contentMigrations.forEach(version => console.warn(`  - ${version}`))
			console.warn('Their data effects are NOT reproduced when bootstrapping from the snapshot.')
			console.warn('Seed any required data manually for local development.')
		}
		return 0
	}
}
