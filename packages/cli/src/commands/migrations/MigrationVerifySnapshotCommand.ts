import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { MigrationSnapshotFacade } from '../../lib/migrations/MigrationSnapshotFacade'

type Args = {}

type Options = {}

export class MigrationVerifySnapshotCommand extends Command<Args, Options> {
	constructor(
		private readonly migrationSnapshotFacade: MigrationSnapshotFacade,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Verifies that snapshot.json still matches a full replay of all migrations')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const result = await this.migrationSnapshotFacade.verify()
		if (result.ok) {
			console.log(result.message)
			return 0
		}
		console.error(result.message)
		return 1
	}
}
