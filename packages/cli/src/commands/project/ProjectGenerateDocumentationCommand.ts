import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { renderProjectInfoHtml } from '../../lib/project/docs/projectDescribe.js'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SchemaLoader } from '../../lib/schema/SchemaLoader.js'
import { validateSchemaAndPrintErrors } from '../../lib/schema/SchemaValidationHelper.js'
import { SchemaVersionBuilder } from '@contember/migrations-client'

type Args = {}

type Options = {
	source?: 'migrations' | 'definition'
	name?: string
	output?: string
}

export class ProjectGenerateDocumentationCommand extends Command<Args, Options> {
	constructor(
		private readonly schemaLoader: SchemaLoader,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Generates HTML documentation from project schema')
		configuration.option('source').valueRequired().description('migrations|definition')
		configuration.option('output').valueRequired().description('file name or "-" for stdout')
		configuration.option('name').valueRequired().description('project name (for the title)')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const schema = input.getOption('source') === 'migrations'
			? await this.schemaVersionBuilder.buildSchema()
			: await this.schemaLoader.loadSchema()
		if (!validateSchemaAndPrintErrors(schema, 'Defined schema is invalid:', undefined, output)) {
			throw new CliError('Defined schema is invalid', { code: 'SCHEMA_INVALID', exitCode: ExitCode.InputError })
		}
		const name = input.getOption('name') ?? 'Contember project'

		const html = await renderProjectInfoHtml(schema, name)
		const destination = input.getOption('output') ?? `${name.toLowerCase().replace(/\s+/g, '-')}.html`
		if (destination === '-') {
			output.data(html, { human: value => value, quiet: value => value.split('\n') })
			return
		}
		await writeFile(join(process.cwd(), destination), html)
		output.data({ path: destination }, it => `Documentation saved to ${it.path}`)
	}
}
