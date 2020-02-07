import { Command, CommandConfiguration, Input } from '../../cli'
import { listProjects, validateProjectName } from '../../utils/project'
import { getProjectDirectories } from '../../NamingHelper'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { Schema } from '@contember/schema'
import { validateSchemaAndPrintErrors } from '../../utils/schema'

type Args = {
	projectName: string
}

type Options = {}

export class ProjectValidateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Validates project schema')
		configuration.argument('projectName')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const [projectName] = [input.getArgument('projectName')]
		const workspaceDirectory = process.cwd()

		const allProjects = projectName === '.'
		if (!allProjects) {
			validateProjectName(projectName)
		}
		const projects = allProjects ? await listProjects({ workspaceDirectory: workspaceDirectory }) : [projectName]
		let valid = true
		for (const projectName of projects) {
			console.group(`Project ${projectName}:`)
			const { migrationsDir, projectDir } = getProjectDirectories(projectName)
			const schema: Schema = require(projectDir).default
			let projectValid = validateSchemaAndPrintErrors(schema, 'Defined schema is invalid:')

			const container = new MigrationsContainerFactory(migrationsDir).create()
			const builtSchema = await container.schemaVersionBuilder.buildSchema()
			projectValid =
				validateSchemaAndPrintErrors(builtSchema, 'Schema built from migrations is invalid:') && projectValid

			if (projectValid) {
				console.log('Project schema is valid')
			}
			console.groupEnd()
			valid = valid && projectValid
		}
		return valid ? 0 : 1
	}
}
