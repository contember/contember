import prompts from 'prompts'
import { MigrationPrinter } from './MigrationPrinter.js'
import {
	isSchemaMigration,
	MigrateErrorCode,
	MigrationExecutor,
	MigrationToExecuteOkStatus,
	SchemaState,
	SchemaStateManager,
	SchemaVersionBuilder,
} from '@contember/migrations-client'
import { MigrationsStatusFacade } from './MigrationsStatusFacade.js'
import { MigrationSnapshotFacade } from './MigrationSnapshotFacade.js'
import { MigrationVersionHelper } from '@contember/engine-common'
import { SystemClientProvider } from '../SystemClientProvider.js'
import { TenantClientProvider } from '../TenantClientProvider.js'
import { RemoteProjectProvider } from '../project/RemoteProjectProvider.js'

export class MigrationExecutionFacade {
	constructor(
		private readonly systemClientProvider: SystemClientProvider,
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly projectProvider: RemoteProjectProvider,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly migrationPrinter: MigrationPrinter,
		private readonly migrationExecutor: MigrationExecutor,
		private readonly migrationStatusFacade: MigrationsStatusFacade,
		private readonly schemaStateManager: SchemaStateManager,
		private readonly migrationSnapshotFacade: MigrationSnapshotFacade,
	) {
	}

	execute = async ({
		requireConfirmation,
		force,
		until,
		additionalMessage,
		useSnapshot = true,
	}: {
		requireConfirmation: boolean | ((migrations: MigrationToExecuteOkStatus[]) => boolean)
		force?: boolean
		until?: string
		additionalMessage?: string
		useSnapshot?: boolean
	}): Promise<boolean> => {
		const project = this.projectProvider.get()
		await this.tenantClientProvider.get().createProject(project.name, true)

		const stateMode = await this.schemaStateManager.isStateMode()
		let schemaState = stateMode ? await this.schemaStateManager.readState() : undefined

		// The state files always reflect the latest schema. When migrating to an older version, that
		// state may reference parts of the model that don't exist yet, so skip it rather than push an
		// inconsistent overlay. Run `migrations:execute` without `--until` to sync the schema state.
		if (until && schemaState) {
			console.log(
				'Warning: schema state was not applied because --until targets a specific migration; the state files reflect the latest schema. Run migrations:execute without --until to sync it.',
			)
			schemaState = undefined
		}

		if (useSnapshot) {
			await this.tryApplySnapshot({ until, schemaState })
		}

		const status = await this.migrationStatusFacade.resolveMigrationsStatus({ force })
		const migrations = until
			? status.migrationsToExecute.filter(it => it.version <= MigrationVersionHelper.extractVersion(until))
			: status.migrationsToExecute
		if (migrations.length === 0 && !schemaState) {
			console.log('No migrations to execute')
			return true
		}
		if (migrations.length > 0) {
			console.log('Will execute following migrations:')
			migrations.forEach(it => console.log(it.name))
		}
		if (schemaState && migrations.length === 0) {
			console.log('Updating schema state')
		}
		additionalMessage && console.log(additionalMessage)

		if (migrations.length > 0 && (typeof requireConfirmation === 'function' ? requireConfirmation(migrations) : requireConfirmation)) {
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

		try {
			await this.migrationExecutor.executeMigrations({
				client: this.systemClientProvider.get(),
				migrations,
				schemaState,
				contentMigrationFactoryArgs: {
					apiToken: project.token,
					apiBaseUrl: project.endpoint,
					projectName: project.name,
					schemaVersionBuilder: this.schemaVersionBuilder,
				},
				log: message => console.log(message),
				force,
			})
		} catch (e) {
			if (isViewReplaceFailure(e)) {
				console.error(
					"\nAn in-place view update (CREATE OR REPLACE VIEW) failed — Postgres rejects it (SQLSTATE 42P16) when a view's"
						+ ' output columns changed (e.g. reordered or retyped) even though its fields did not.\n'
						+ 'Re-generate the migration with `migrations:diff <name> --recreate-views` to drop & recreate the affected'
						+ ' views (and their dependants) instead.\n',
				)
			}
			throw e
		}
		return true
	}

	private async tryApplySnapshot({ until, schemaState }: { until?: string; schemaState?: SchemaState }): Promise<void> {
		const executed = await this.systemClientProvider.get().listExecutedMigrations()
		const snapshot = await this.migrationSnapshotFacade.getUsableSnapshot(executed)
		if (!snapshot) {
			return
		}
		if (until && snapshot.version > MigrationVersionHelper.extractVersion(until)) {
			// snapshot reaches past the requested target — fall back to a normal replay
			return
		}
		console.log(`Bootstrapping from snapshot (collapses ${snapshot.covers.length} migrations up to ${snapshot.version})`)
		if (snapshot.contentMigrations.length > 0) {
			console.warn(
				`Note: ${snapshot.contentMigrations.length} content migration(s) are covered by the snapshot; their data is NOT reproduced.`,
			)
		}
		const input = await this.migrationSnapshotFacade.buildSnapshotInput(snapshot)
		try {
			await this.systemClientProvider.get().migrateFromSnapshot(input, schemaState)
		} catch (e) {
			if (isProjectNotEmptyError(e)) {
				// The project was migrated between our emptiness check and the server call (e.g. a
				// concurrent execute on a fresh database). Fall back to a normal replay rather than
				// crashing — the subsequent status resolution will pick up whatever is left to run.
				console.warn('Snapshot skipped: the project is no longer empty. Falling back to a full replay.')
				return
			}
			throw e
		}
		console.log('Snapshot applied')
	}
}

const isProjectNotEmptyError = (e: unknown): boolean =>
	Array.isArray(e) && e.some(it => it !== null && typeof it === 'object' && (it as { code?: unknown }).code === MigrateErrorCode.ProjectNotEmpty)

// A failed `updateView` modification surfaces as MIGRATION_FAILED whose developerMessage embeds the failing
// statement (`CREATE OR REPLACE VIEW …`). Since each modification's SQL is executed in isolation, that string
// is a precise signal that an in-place view update — and not some other statement — is what Postgres rejected.
const isViewReplaceFailure = (e: unknown): boolean =>
	Array.isArray(e) && e.some(it =>
		it !== null
		&& typeof it === 'object'
		&& (it as { code?: unknown }).code === MigrateErrorCode.MigrationFailed
		&& typeof (it as { message?: unknown }).message === 'string'
		&& (it as { message: string }).message.includes('CREATE OR REPLACE VIEW')
	)
