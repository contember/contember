import { Command, CommandConfiguration, Input, Workspace } from '@contember/cli-common'
import { executeCreateMigrationCommand } from '../../utils/migrations/MigrationCreateHelper'

type Args = {
	project?: string
	migrationName: string
	format?: string
}

type Options = {
}

export class MigrationBlankCommand extends Command<Args, Options> {
	constructor(
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates new blank migration file')
		if (!this.workspace.isSingleProjectMode()) {
			configuration.argument('project')

		}
		configuration.argument('migrationName')
		configuration.argument('format').optional().validator(it => !it || ['js', 'ts', 'json'].includes(it))
			.description('Migration file format (js, ts, json), default is ts.')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		return await executeCreateMigrationCommand(
			input,
			{ workspace: this.workspace },
			async ({
				migrationCreator,
			}) => {
				const filename = await migrationCreator.createEmptyMigrationFile(input.getArgument('migrationName'), input.getArgument('format') || 'ts')
				console.log(`${filename} created`)

				return 0
			},
		)
	}
}

