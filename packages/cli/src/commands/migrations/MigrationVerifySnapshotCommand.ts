import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { MigrationSnapshotFacade } from '../../lib/migrations/MigrationSnapshotFacade.js'

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

	protected async execute(input: Input<Args, Options>, output: Output): Promise<number> {
		const result = await this.migrationSnapshotFacade.verify()
		output.data(result, {
			human: value => value.message,
			quiet: value => value.ok,
		})
		return result.ok ? 0 : 1
	}
}
