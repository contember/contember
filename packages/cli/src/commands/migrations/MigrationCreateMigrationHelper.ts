import { CommandConfiguration, Input } from '../../cli'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { MigrationCreator, MigrationDescriber } from '@contember/schema-migrations'
import { Workspace } from '../../utils/Workspace'
import path from 'path'

type Args = {
	projectName: string
	migrationName: string
}

type Options = {
	['migrations-dir']?: string
	['project-dir']?: string
}

export const configureCreateMigrationCommand = (configuration: CommandConfiguration<Args, Options>) => {
	configuration.argument('projectName')
	configuration.argument('migrationName')
	configuration.option('migrations-dir').valueRequired()
	configuration.option('project-dir').valueRequired()
}

export const executeCreateMigrationCommand = async (
	input: Input<Args, Options>,
	createMigrationCallback: (args: {
		migrationName: string
		projectDir: string
		migrationsDir: string
		projectName: string
		migrationCreator: MigrationCreator
		migrationDescriber: MigrationDescriber
	}) => Promise<number>,
) => {
	const [projectName, migrationName] = [input.getArgument('projectName'), input.getArgument('migrationName')]
	const workspace = await Workspace.get(process.cwd())
	const allProjects = projectName === '.'
	const projects = allProjects
		? await workspace.projects.listProjects()
		: [await workspace.projects.getProject(projectName, { fuzzy: true })]

	const projectDirArg = input.getOption('project-dir')
	const migrationsDirArg = input.getOption('migrations-dir')
	if (allProjects && (projectDirArg || migrationsDirArg)) {
		throw 'Migrations dir and project dir options are not allowed when using "*" as a project name'
	}
	for (const project of projects) {
		console.group(`Project ${projectName}:`)
		const projectDir = projectDirArg ? path.resolve(process.cwd(), projectDirArg) : project.apiDir
		const migrationsDir = migrationsDirArg ? path.resolve(process.cwd(), migrationsDirArg) : project.migrationsDir
		const container = new MigrationsContainerFactory(migrationsDir).create()

		const result = await createMigrationCallback({
			projectDir,
			projectName,
			migrationName,
			migrationsDir,
			migrationCreator: container.migrationCreator,
			migrationDescriber: container.migrationsDescriber,
		})
		console.groupEnd()
		if (result > 0) {
			return result
		}
	}
	return 0
}
