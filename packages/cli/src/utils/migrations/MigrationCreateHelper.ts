import { Input, Project, Workspace } from '@contember/cli-common'
import { MigrationsContainerFactory } from './MigrationsContainer'
import { MigrationDescriber, SchemaMigrator } from '@contember/schema-migrations'
import { MigrationCreator } from './MigrationCreator'
import { MigrationsResolver } from './MigrationsResolver'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import { MigrationFilesManager } from './MigrationFilesManager'

type Args = {
	project?: string
	migrationName: string
}

type Options = {}

export const executeCreateMigrationCommand = async (
	input: Input<Pick<Args, 'project'>, Options>,
	{ workspace }: {workspace: Workspace},
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
