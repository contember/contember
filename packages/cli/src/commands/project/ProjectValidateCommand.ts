import { Command, CommandConfiguration, Input } from '../../cli'
import { validateProjectName } from '../../utils/Project'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { Schema } from '@contember/schema'
import { validateSchemaAndPrintErrors } from '../../utils/schema'
import { emptySchema } from '@contember/schema-utils'
import { SchemaUpdateError } from '@contember/schema-migrations/dist/src/modifications/exceptions'
import { Workspace } from '../../utils/Workspace'

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
		const workspace = await Workspace.get(process.cwd())

		const allProjects = projectName === '.'
		if (!allProjects) {
			validateProjectName(projectName)
		}
		const projects = allProjects
			? await workspace.projects.listProjects()
			: [await workspace.projects.getProject(projectName)]
		let valid = true
		const invalidProjects = []
		for (const project of projects) {
			console.group(`Project ${project.name}:`)
			const migrationsDir = await project.migrationsDir
			const container = new MigrationsContainerFactory(migrationsDir).create()
			let projectValid = true
			let migratedSchema = emptySchema
			for (const migration of await container.migrationsResolver.getMigrations()) {
				try {
					// just a check that it does not fail
					await container.migrationsDescriber.describeModifications(migratedSchema, migration)

					migratedSchema = container.schemaMigrator.applyModifications(
						migratedSchema,
						migration.modifications,
						migration.formatVersion,
					)
				} catch (e) {
					if (e instanceof SchemaUpdateError) {
						console.error(`Migration ${migration.name} has failed`)
					}
					throw e
				}
				projectValid =
					validateSchemaAndPrintErrors(migratedSchema, `Migration ${migration.name} produces invalid schema:`) &&
					projectValid
			}

			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const schema: Schema = require(project.directory).default
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
				invalidProjects.push(projectName)
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
