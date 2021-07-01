import { Command, CommandConfiguration, Input } from '../../cli'
import { validateProjectName } from '../../utils/Project'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { Schema } from '@contember/schema'
import { validateSchemaAndPrintErrors } from '../../utils/schema'
import { emptySchema } from '@contember/schema-utils'
import { Workspace } from '../../utils/Workspace'
import { validateMigrations } from '../migrations/MigrationValidationHelper'

type Args = {
	project: string
}

type Options = {}

export class ProjectValidateCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Validates project schema')
		configuration.argument('project')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const [projectName] = [input.getArgument('project')]
		const workspace = await Workspace.get(process.cwd())

		const allProjects = projectName === '.'
		if (!allProjects) {
			validateProjectName(projectName)
		}
		const projects = allProjects
			? await workspace.projects.listProjects()
			: [await workspace.projects.getProject(projectName, { fuzzy: true })]
		let valid = true
		const invalidProjects = []
		for (const project of projects) {
			console.group(`Project ${project.name}:`)
			const migrationsDir = await project.migrationsDir
			const container = new MigrationsContainerFactory(migrationsDir).create()
			const migrations = await container.migrationsResolver.getMigrations()
			let projectValid = await validateMigrations(
				emptySchema,
				migrations,
				container.migrationDescriber,
				container.schemaMigrator,
			)

			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const schema: Schema = require(project.apiDir).default
			projectValid = validateSchemaAndPrintErrors(schema, 'Defined schema is invalid:')

			const builtSchema = await container.schemaVersionBuilder.buildSchema()
			projectValid =
				validateSchemaAndPrintErrors(builtSchema, 'Schema built from migrations is invalid:') && projectValid

			if (projectValid) {
				const diff = await container.schemaDiffer.diffSchemas(builtSchema, schema)
				if (diff.length > 0) {
					console.log('Migrations are not in sync with a defined schema')
					projectValid = false
				}
			}

			if (projectValid) {
				console.log('Project schema is valid')
			} else {
				invalidProjects.push(project.name)
			}
			console.groupEnd()
			valid = valid && projectValid
		}
		if (invalidProjects) {
			console.log('Following projects failed the validation:')
			invalidProjects.forEach(it => console.log(it))
		}
		return valid ? 0 : 1
	}
}
