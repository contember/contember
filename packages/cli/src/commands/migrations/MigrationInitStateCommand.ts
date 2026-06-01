import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { SchemaStateManager } from '@contember/migrations-client'
import { SchemaLoader } from '../../lib/schema/SchemaLoader.js'

type Args = {}

type Options = {}

export class MigrationInitStateCommand extends Command<Args, Options> {
	constructor(
		private readonly schemaLoader: SchemaLoader,
		private readonly schemaStateManager: SchemaStateManager,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Enables schema state mode by extracting ACL, validation, actions and settings into the state/ directory')
	}

	protected async execute(): Promise<number> {
		if (await this.schemaStateManager.isStateMode()) {
			console.log('Schema state mode is already enabled')
			return 0
		}

		const schema = await this.schemaLoader.loadSchema()
		await this.schemaStateManager.extractState(schema)

		console.log('Schema state mode enabled. ACL, validation, actions and settings are now managed in the state/ directory.')
		console.log('These parts of the schema will no longer be written into migrations.')
		return 0
	}
}
