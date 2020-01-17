import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { SchemaValidator } from '@contember/schema-utils'
import { Schema } from '@contember/schema'
import { isDeepStrictEqual } from 'util'
import { Input } from '../cli/Input'
import { MigrationsContainerFactory } from '../MigrationsContainer'
import { getProjectDirectories } from '../NamingHelper'
import { listProjects } from '../utils/project'

type Args = {
	projectName: string
	migrationName: string
}

type Options = {
	['migrations-dir']?: string
	['project-dir']?: string
}

export class DiffCommand extends Command<Args, Options> {
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
			throw new Error('Migrations dir and project dir options are not allowed when using "*" as a project name')
		}
		for (const projectName of projects) {
			console.group(`Project ${projectName}:`)
			const { migrationsDir, projectDir } = getProjectDirectories(projectName, {
				projectDir: projectDirArg,
				migrationsDir: migrationsDirArg,
			})
			const schema: Schema = require(projectDir).default

			const container = new MigrationsContainerFactory(migrationsDir).create()
			const validator = new SchemaValidator()
			const [validSchema, errors] = validator.validate(schema)

			if (errors.length === 0 && !isDeepStrictEqual(validSchema, schema)) {
				throw new Error('There is something wrong with a schema validator')
			}
			if (errors.length > 0) {
				console.group('Schema is invalid:')
				for (const err of errors) {
					console.error(err.path.join('.') + ': ' + err.message)
				}
				console.groupEnd()
				continue
			}

			const result = await container.migrationDiffCreator.createDiff(schema, migrationName)

			if (result === null) {
				console.log('Nothing to do')
			} else {
				console.log(`${result} created`)
			}
			console.groupEnd()
		}
	}
}
