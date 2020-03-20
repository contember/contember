import { CommandConfiguration, Input } from '../../cli'
import { listProjects } from '../../utils/project'
import { getProjectDirectories } from '../../NamingHelper'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { printValidationErrors } from '../../utils/schema'
import { MigrationCreator, MigrationDescriber } from '@contember/schema-migrations'

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
	}) => Promise<void>,
) => {
	const [projectArg, migrationName] = [input.getArgument('projectName'), input.getArgument('migrationName')]
	const allProjects = projectArg === '.'
	const projects = allProjects ? await listProjects({ workspaceDirectory: process.cwd() }) : [projectArg]
	const projectDirArg = input.getOption('project-dir')
	const migrationsDirArg = input.getOption('migrations-dir')
	if (allProjects && (projectDirArg || migrationsDirArg)) {
		throw 'Migrations dir and project dir options are not allowed when using "*" as a project name'
	}
	for (const projectName of projects) {
		console.group(`Project ${projectName}:`)
		const { migrationsDir, projectDir } = getProjectDirectories(projectName, {
			projectDir: projectDirArg,
			migrationsDir: migrationsDirArg,
		})
		const container = new MigrationsContainerFactory(migrationsDir).create()

		await createMigrationCallback({
			projectDir,
			projectName,
			migrationName,
			migrationsDir,
			migrationCreator: container.migrationCreator,
			migrationDescriber: container.migrationsDescriber,
		})

		console.groupEnd()
	}
}
