import { Command, CommandConfiguration, Input } from '../../cli'
import { Schema } from '@contember/schema'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { getProjectDirectories } from '../../NamingHelper'
import { listProjects } from '../../utils/project'
import { printValidationErrors } from '../../utils/schema'
import { InvalidSchemaException } from '@contember/schema-migrations'

type Args = {
	projectName: string
	migrationName: string
}

type Options = {
	['migrations-dir']?: string
	['project-dir']?: string
}

export class MigrationsDiffCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates .json schema migration for given project')
		configuration.argument('projectName')
		configuration.argument('migrationName')
		configuration.option('migrations-dir').valueRequired()
		configuration.option('project-dir').valueRequired()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
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
			const schema: Schema = require(projectDir).default

			const container = new MigrationsContainerFactory(migrationsDir).create()
			try {
				const result = await container.migrationCreator.createDiff(schema, migrationName)
				if (result === null) {
					console.log('Nothing to do')
				} else {
					console.log(`${result} created`)
				}
			} catch (e) {
				if (e instanceof InvalidSchemaException) {
					printValidationErrors(e.validationErrors, e.message)
					continue
				}
				throw e
			}

			console.groupEnd()
		}
	}
}
