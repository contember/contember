import { Command, CommandConfiguration, Input, validateProjectName, Workspace } from '@contember/cli-common'
import { validateSchemaAndPrintErrors } from '../../utils/schema'
import { loadSchema } from '../../utils/project/loadSchema'
import { renderProjectInfoHtml } from '../../utils/project/projectDescribe'
import { writeFile } from 'fs/promises'
import { join } from 'path'

type Args = {
	project: string
}

type Options = {
	output?: string
}

export class ProjectGenerateDocumentation extends Command<Args, Options> {
	constructor(
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Generates HTML documentation from project schema')
		configuration.argument('project')
		configuration.option('output').valueRequired().description('file name or "stdout"')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const projectName = input.getArgument('project')
		const workspace = this.workspace

		validateProjectName(projectName)
		const project = await workspace.projects.getProject(projectName, { fuzzy: true })
		const schema = await loadSchema(project)
		if (!validateSchemaAndPrintErrors(schema, 'Defined schema is invalid:')) {
			return 1
		}
		const html = await renderProjectInfoHtml(schema, project.name)
		const output = input.getOption('output') ?? `${project.name}.html`
		if (output === 'stdout') {
			console.log(html)
		} else {
			console.log(`Documentation saved to ${output}`)
			await writeFile(join(process.cwd(), output), html)
		}

		return 0
	}
}
