import Command from '../core/cli/Command'
import { createMigrationFilesManager as createTenantMigrationFilesManager } from '@contember/engine-tenant-api'
import { createMigrationFilesManager as createProjectMigrationFilesManager } from '@contember/engine-system-api'
import CommandConfiguration from '../core/cli/CommandConfiguration'
import { assertNever } from '@contember/utils'
import { MigrationFilesManager } from '@contember/engine-common'
import { Input } from '../core/cli/Input'

type Args = {
	type: 'project' | 'tenant'
	name: string
}

class EngineMigrationsCreateCommand extends Command<Args, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('For engine developers only')
		configuration
			.argument('type')
			.description('project|tenant')
			.validator(val => ['project', 'tenant'].includes(val))
		configuration.argument('name')
	}

	protected async execute(input: Input<Args, {}>): Promise<void> {
		const [type, name] = [input.getArgument('type'), input.getArgument('name')]
		let migrationsFileManager: MigrationFilesManager
		switch (type) {
			case 'tenant':
				migrationsFileManager = createTenantMigrationFilesManager()
				break
			case 'project':
				migrationsFileManager = createProjectMigrationFilesManager()
				break
			default:
				return assertNever(type)
		}
		console.log(await migrationsFileManager.createEmptyFile(name, 'sql'))
	}
}

export default EngineMigrationsCreateCommand
