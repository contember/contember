import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { MigrationExecutionFacade } from '../../lib/migrations/MigrationExecutionFacade'

type Args = {
}

type Options = {
	until?: string
	force: boolean
	yes?: boolean
}

export class MigrationExecuteCommand extends Command<Args, Options> {
	constructor(
		private readonly migrationExecutorFacade: MigrationExecutionFacade,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Executes migrations on Contember server.')
		configuration.option('force')
			.description('Ignore migrations order and missing migrations (dev only)')
		configuration.option('until')
			.valueRequired()
			.description('Execute all migrations leading up to, and inclusive of, a specified migration')
		configuration //
			.option('yes')
			.valueNone()
			.description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const force = input.getOption('force')
		const until = input.getOption('until')

		await this.migrationExecutorFacade.execute({
			force,
			until,
			requireConfirmation: !input.getOption('yes'),
		})
	}
}
