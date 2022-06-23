import { CommandConfiguration, Input, Workspace, Project } from '@contember/cli-common'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import {
	MigrationCreator,
	MigrationDescriber,
	MigrationFilesManager,
	MigrationsResolver,
	SchemaMigrator,
	SchemaVersionBuilder,
} from '@contember/schema-migrations'

type Args = {
	project: string
	migrationName: string
}

type Options = {}

export const configureCreateMigrationCommand = (configuration: CommandConfiguration<Args, Options>) => {
	configuration.argument('project')
	configuration.argument('migrationName')
}

export const executeCreateMigrationCommand = async (
	input: Input<Pick<Args, 'project'>, Options>,
	createMigrationCallback: (args: {
		workspace: Workspace
		project: Project
		migrationCreator: MigrationCreator
		migrationDescriber: MigrationDescriber
		migrationsResolver: MigrationsResolver
		schemaVersionBuilder: SchemaVersionBuilder
		schemaMigrator: SchemaMigrator
		migrationFilesManager: MigrationFilesManager
	}) => Promise<number>,
) => {
	const projectName = input.getArgument('project')
	const workspace = await Workspace.get(process.cwd())
	const allProjects = projectName === '.'
	const projects = allProjects
		? await workspace.projects.listProjects()
		: [await workspace.projects.getProject(projectName, { fuzzy: true })]

	for (const project of projects) {
		console.group(`Project ${project.name}:`)
		const container = new MigrationsContainerFactory(project.migrationsDir).create()

		const result = await createMigrationCallback({
			project,
			migrationCreator: container.migrationCreator,
			migrationDescriber: container.migrationDescriber,
			migrationsResolver: container.migrationsResolver,
			schemaVersionBuilder: container.schemaVersionBuilder,
			schemaMigrator: container.schemaMigrator,
			migrationFilesManager: container.migrationFilesManager,
			workspace,
		})
		console.groupEnd()
		if (result > 0) {
			return result
		}
	}
	return 0
}
