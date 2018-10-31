import Command from '../core/cli/Command'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import BaseCommand from './BaseCommand'
import CommandConfiguration from '../core/cli/CommandConfiguration'

type Args = {
	type: 'project' | 'tenant'
	name: string
}

class EngineMigrationsCreateCommand extends BaseCommand<Args, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.name('engine:migrations:create')
		configuration.description('For engine developers only')
		configuration.argument('type')
			.description('project|tenant')
			.validator(val => ['project', 'tenant'].includes(val))
		configuration.argument('name')
	}


	protected async execute(input: Command.Input<Args, {}>): Promise<void> {
		const [type, name] = [input.getArgument('type'), input.getArgument('name')]
		const migrationsFileManager = MigrationFilesManager.createForEngine(type)
		console.log(await migrationsFileManager.createEmptyFile(name, 'sql'))
	}
}

export default EngineMigrationsCreateCommand
