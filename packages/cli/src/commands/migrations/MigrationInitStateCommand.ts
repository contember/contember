import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { SchemaStateManager } from '@contember/migrations-client'
import { SchemaLoader } from '../../lib/schema/SchemaLoader.js'

type Args = {}

type Options = {}

type InitStateResult = {
	enabled: true
	changed: boolean
}

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

	protected async execute(input: Input<Args, Options>, output: Output): Promise<number> {
		if (await this.schemaStateManager.isStateMode()) {
			output.info('Schema state mode is already enabled')
			writeMachineResult(output, { enabled: true, changed: false })
			return 0
		}

		const schema = await this.schemaLoader.loadSchema()
		await this.schemaStateManager.extractState(schema)

		output.info('Schema state mode enabled. ACL, validation, actions and settings are now managed in the state/ directory.')
		output.info('These parts of the schema will no longer be written into migrations.')
		writeMachineResult(output, { enabled: true, changed: true })
		return 0
	}
}

const writeMachineResult = (output: Output, result: InitStateResult): void => {
	if (output.mode !== 'human') {
		output.data(result, { quiet: value => value.changed })
	}
}
