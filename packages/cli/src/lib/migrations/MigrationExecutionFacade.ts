import prompts from 'prompts'
import { MigrationPrinter } from './MigrationPrinter'
import { isSchemaMigration, MigrationExecutor, MigrationToExecuteOkStatus, SchemaVersionBuilder } from '@contember/migrations-client'
import { MigrationsStatusFacade } from './MigrationsStatusFacade'
import { MigrationVersionHelper } from '@contember/engine-common'
import { RemoteProject } from '../project/RemoteProject'
import { SystemClientProvider } from '../SystemClientProvider'
import { TenantClientProvider } from '../TenantClientProvider'
import { RemoteProjectProvider } from '../project/RemoteProjectProvider'

export class MigrationExecutionFacade {
	constructor(
		private readonly systemClientProvider: SystemClientProvider,
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly projectProvider: RemoteProjectProvider,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly migrationPrinter: MigrationPrinter,
		private readonly migrationExecutor: MigrationExecutor,
		private readonly migrationStatusFacade: MigrationsStatusFacade,
	) {
	}

	execute = async ({
		requireConfirmation,
		force,
		until,
		additionalMessage,
	}: {
		requireConfirmation: boolean | ((migrations: MigrationToExecuteOkStatus[]) => boolean)
		force?: boolean
		until?: string
		additionalMessage?: string
	}): Promise<boolean> => {
		const project = this.projectProvider.get()
		await this.tenantClientProvider.get().createProject(project.name, true)

		const status = await this.migrationStatusFacade.resolveMigrationsStatus({ force })
		const migrations = until
			? status.migrationsToExecute.filter(it => it.version <= MigrationVersionHelper.extractVersion(until))
			: status.migrationsToExecute
		if (migrations.length === 0) {
			console.log('No migrations to execute')
			return true
		}
		console.log('Will execute following migrations:')
		migrations.forEach(it => console.log(it.name))
		additionalMessage && console.log(additionalMessage)

		if (typeof requireConfirmation === 'function' ? requireConfirmation(migrations) : requireConfirmation) {
			if (!process.stdin.isTTY) {
				throw 'TTY not available. Pass --yes option to confirm execution.'
			}
			do {
				const { action } = await prompts({
					type: 'select',
					name: 'action',
					message: 'Do you want to continue?',
					choices: [
						{ value: 'yes', title: 'Execute migrations' },
						{ value: 'describe', title: 'Describe migrations' },
						{ value: 'no', title: 'Abort' },
					],
				})
				if (action === 'describe') {
					const schema = await this.schemaVersionBuilder.buildSchemaUntil(migrations[0].version)
					for (const migration of migrations) {
						const migrationContent = await migration.localMigration.getContent()
						if (!isSchemaMigration(migrationContent)) {
							continue
						}

						await this.migrationPrinter.printMigrationDescription(schema, migrationContent, {
							noSql: true,
						})
					}
				} else if (action === 'yes') {
					break
				} else {
					return false
				}
			} while (true)
		}

		await this.migrationExecutor.executeMigrations({
			client: this.systemClientProvider.get(),
			migrations,
			contentMigrationFactoryArgs: {
				apiToken: project.token,
				apiBaseUrl: project.endpoint,
				projectName: project.name,
			},
			log: message => console.log(message),
			force,
		})
		return true
	}
}
