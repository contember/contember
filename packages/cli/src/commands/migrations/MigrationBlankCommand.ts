import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { MigrationCreator } from '@contember/migrations-client'

type Args = {
	migrationName: string
	format?: string
}

type Options = {
}

export class MigrationBlankCommand extends Command<Args, Options> {
	constructor(
		private readonly migrationCreator: MigrationCreator,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates new blank migration file')
		configuration.argument('migrationName')
		configuration.argument('format').optional().validator(it => !it || ['js', 'ts', 'json'].includes(it))
			.description('Migration file format (js, ts, json), default is ts.')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const migrationName = input.getArgument('migrationName')
		const migrationFormat = input.getArgument('format') || 'ts'
		const filename = await this.migrationCreator.createEmptyMigrationFile(migrationName, migrationFormat)
		console.log(`${filename} created`)
		return 0
	}
}

