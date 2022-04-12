import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { interactiveResolveApiToken } from '../../utils/tenant'
import { SystemClient } from '../../utils/system'
import { createMigrationStatusTable, getMigrationsStatus, MigrationState, sortMigrations } from '../../utils/migrations'
import chalk from 'chalk'
import { Workspace } from '@contember/cli-common'

type Args = {
	project: string
}

type Options = {
	instance?: string
	['remote-project']?: string
	['only-to-execute']?: true
	['only-errors']?: true
	['restore-missing']?: true
}

export class MigrationStatusCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Shows status of executed migrations on an instance & sync status')
		configuration.argument('project')
		configuration //
			.option('instance')
			.valueRequired()
			.description('Local instance name or remote Contember API URL')
		configuration //
			.option('remote-project')
			.valueRequired()
			.description('Specify this when remote project name does not match local project name.')
		configuration //
			.option('only-errors')
			.valueNone()
			.description('Show only migrations with an error.')
		configuration //
			.option('only-to-execute')
			.valueNone()
			.description('Show only migrations to execute.')
		configuration //
			.option('restore-missing')
			.valueNone()
			.description('Restores migrations locally missing')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const projectName = input.getArgument('project')

		const workspace = await Workspace.get(process.cwd())
		const project = await workspace.projects.getProject(projectName, { fuzzy: true })
		const migrationsDir = await project.migrationsDir
		const container = new MigrationsContainerFactory(migrationsDir).create()

		const instance = await interactiveResolveInstanceEnvironmentFromInput(workspace, input.getOption('instance'))
		const apiToken = await interactiveResolveApiToken({ workspace, instance })
		const remoteProject = input.getOption('remote-project') || project.name
		const client = SystemClient.create(instance.baseUrl, remoteProject, apiToken)

		const executedMigrations = await client.listExecutedMigrations()
		let localMigrations = await container.migrationsResolver.getMigrations()
		let status = getMigrationsStatus(executedMigrations, localMigrations)
		const restoreMissing = input.getOption('restore-missing')
		if (restoreMissing) {
			const missing = status.errorMigrations.filter(it => it.state === MigrationState.EXECUTED_MISSING)
			for (const migration of missing) {
				console.log(`Restoring migration ${migration.name}`)
				const fullMigration = await client.getExecutedMigration(migration.version)
				await container.migrationFilesManager.createFile(
					JSON.stringify(
						{
							formatVersion: fullMigration.formatVersion,
							modifications: fullMigration.modifications,
						},
						undefined,
						'\t',
					) + '\n',
					fullMigration.name,
				)
			}
			localMigrations = await container.migrationsResolver.getMigrations()
			status = getMigrationsStatus(executedMigrations, localMigrations)
		}

		const onlyErrors = input.getOption('only-errors')
		const onlyToExecute = input.getOption('only-to-execute')

		const filtered =
			onlyErrors || onlyToExecute
				? sortMigrations([
					...(onlyErrors ? status.errorMigrations : []),
					...(onlyToExecute ? status.migrationsToExecute : []),
				  ])
				: status.allMigrations
		console.log(createMigrationStatusTable(filtered))
		const hasErrors = status.errorMigrations.length > 0

		if (hasErrors) {
			console.error(chalk.redBright('Some migrations are broken'))
		}

		return hasErrors ? 1 : 0
	}
}
