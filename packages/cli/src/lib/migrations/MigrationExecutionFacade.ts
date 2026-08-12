import { MigrationPrinter } from './MigrationPrinter.js'
import {
	isSchemaMigration,
	MigrateErrorCode,
	MigrationExecutor,
	MigrationToExecuteOkStatus,
	SchemaState,
	SchemaStateManager,
	SchemaVersionBuilder,
	SnapshotFile,
} from '@contember/migrations-client'
import { MigrationsStatusFacade } from './MigrationsStatusFacade.js'
import { MigrationSnapshotFacade } from './MigrationSnapshotFacade.js'
import { MigrationVersionHelper } from '@contember/engine-common'
import { SystemClientProvider } from '../SystemClientProvider.js'
import { TenantClientProvider } from '../TenantClientProvider.js'
import { RemoteProjectProvider } from '../project/RemoteProjectProvider.js'
import { CliError, ExitCode, Output } from '@contember/cli-common'
import { GraphQlClientError } from '@contember/graphql-client'
import { promptSelect } from '../prompt/index.js'

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
		private readonly output: Output = new Output(),
	) {
	}

	execute = async ({
		requireConfirmation,
		force,
		until,
		additionalMessage,
		useSnapshot = true,
		onConfirmed,
	}: {
		requireConfirmation: boolean | ((migrations: MigrationToExecuteOkStatus[]) => boolean)
		force?: boolean
		until?: string
		additionalMessage?: string
		useSnapshot?: boolean
		onConfirmed?: () => void
	}): Promise<boolean> => {
		const project = this.projectProvider.get()
		const stateMode = await this.schemaStateManager.isStateMode()
		let schemaState = stateMode ? await this.schemaStateManager.readState() : undefined
		const localMigrations = await this.migrationStatusFacade.getLocalMigrationFiles()

		// The state files always reflect the latest schema. When migrating to an older version, that
		// state may reference parts of the model that don't exist yet, so skip it rather than push an
		// inconsistent overlay. Run `migrations execute` without `--until` to sync the schema state.
		if (until && schemaState) {
			this.output.warn(
				'Warning: schema state was not applied because --until targets a specific migration; the state files reflect the latest schema. Run "migrations execute" without --until to sync it.',
			)
			schemaState = undefined
		}
		if (localMigrations.length === 0 && !schemaState) {
			this.output.info('No migrations to execute')
			return false
		}

		let migrationsToConfirm: MigrationToExecuteOkStatus[] = []
		if (localMigrations.length > 0) {
			const status = await this.resolvePreflightStatus({ force })
			migrationsToConfirm = until
				? status.migrationsToExecute.filter(it => it.version <= MigrationVersionHelper.extractVersion(until))
				: status.migrationsToExecute
			if (migrationsToConfirm.length === 0 && !schemaState) {
				this.output.info('No migrations to execute')
				return false
			}
			if (migrationsToConfirm.length > 0) {
				this.output.info('Will execute following migrations:')
				migrationsToConfirm.forEach(it => this.output.info(it.name))
			}
		}
		if (schemaState && localMigrations.length === 0) {
			this.output.info('Will update schema state')
		}
		if (additionalMessage) {
			this.output.info(additionalMessage)
		}

		if (typeof requireConfirmation === 'function' ? requireConfirmation(migrationsToConfirm) : requireConfirmation) {
			if (!this.output.canPrompt()) {
				throw new CliError('TTY not available. Pass --yes to confirm execution.', {
					code: 'TTY_UNAVAILABLE',
					exitCode: ExitCode.InputError,
				})
			}
			do {
				const action = await promptSelect(this.output, {
					message: 'Do you want to continue?',
					choices: [
						{ value: 'yes', title: migrationsToConfirm.length > 0 ? 'Execute migrations' : 'Update schema state' },
						...(migrationsToConfirm.length > 0 ? [{ value: 'describe', title: 'Describe migrations' }] : []),
						{ value: 'no', title: 'Abort' },
					],
				})
				if (action === 'describe') {
					const schema = await this.schemaVersionBuilder.buildSchemaUntil(migrationsToConfirm[0].version)
					for (const migration of migrationsToConfirm) {
						const content = await migration.localMigration.getContent()
						if (isSchemaMigration(content)) {
							this.migrationPrinter.printMigrationDescription(schema, content, { noSql: true })
						}
					}
					continue
				}
				if (action === 'yes') {
					onConfirmed?.()
					break
				}
				throw new CliError('Migration execution aborted', {
					code: 'OPERATION_ABORTED',
					exitCode: ExitCode.InputError,
				})
			} while (true)
		}

		await this.tenantClientProvider.get().createProject(project.name, true, { noDeployToken: true })

		const snapshot = useSnapshot ? await this.getSnapshotToApply({ until }) : undefined

		let status = await this.migrationStatusFacade.resolveMigrationsStatus({ force })
		let migrations = until
			? status.migrationsToExecute.filter(it => it.version <= MigrationVersionHelper.extractVersion(until))
			: status.migrationsToExecute
		if (schemaState && migrations.length === 0) {
			this.output.info('Updating schema state')
		}
		if (snapshot) {
			this.output.info(`Will bootstrap from snapshot (${snapshot.covers.length} migrations up to ${snapshot.version})`)
		}
		if (migrations.length === 0 && !schemaState && !snapshot) {
			this.output.info('No pending migrations to execute')
			return false
		}

		if (snapshot) {
			await this.applySnapshot(snapshot, schemaState)
			status = await this.migrationStatusFacade.resolveMigrationsStatus({ force })
			migrations = until
				? status.migrationsToExecute.filter(it => it.version <= MigrationVersionHelper.extractVersion(until))
				: status.migrationsToExecute
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
				log: message => this.output.info(message),
				force,
			})
		} catch (e) {
			if (isViewReplaceFailure(e)) {
				this.output.error(
					"\nAn in-place view update (CREATE OR REPLACE VIEW) failed — Postgres rejects it (SQLSTATE 42P16) when a view's"
						+ ' output columns changed (e.g. reordered or retyped) even though its fields did not.\n'
						+ 'Re-generate the migration with `migrations diff <name> --recreate-views` to drop & recreate the affected'
						+ ' views (and their dependants) instead.\n',
				)
			}
			throw e
		}
		return true
	}

	private async resolvePreflightStatus({ force }: { force?: boolean }) {
		try {
			return await this.migrationStatusFacade.resolveMigrationsStatus({ force })
		} catch (error) {
			if (!(error instanceof GraphQlClientError) || error.response?.status !== 404) {
				throw error
			}
			return await this.migrationStatusFacade.resolveMigrationsStatusFromExecuted([], { force })
		}
	}

	private async getSnapshotToApply({ until }: { until?: string }): Promise<SnapshotFile | undefined> {
		const executed = await this.systemClientProvider.get().listExecutedMigrations()
		const snapshot = await this.migrationSnapshotFacade.getUsableSnapshot(executed)
		if (!snapshot) {
			return undefined
		}
		if (until && snapshot.version > MigrationVersionHelper.extractVersion(until)) {
			// snapshot reaches past the requested target — fall back to a normal replay
			return undefined
		}
		return snapshot
	}

	private async applySnapshot(snapshot: SnapshotFile, schemaState?: SchemaState): Promise<void> {
		this.output.info(`Bootstrapping from snapshot (collapses ${snapshot.covers.length} migrations up to ${snapshot.version})`)
		if (snapshot.contentMigrations.length > 0) {
			this.output.warn(
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
				this.output.warn('Snapshot skipped: the project is no longer empty. Falling back to a full replay.')
				return
			}
			throw e
		}
		this.output.info('Snapshot applied')
	}
}

const isProjectNotEmptyError = (e: unknown): boolean => Array.isArray(e) && e.some(it => hasCode(it, MigrateErrorCode.ProjectNotEmpty))

// A failed `updateView` modification surfaces as MIGRATION_FAILED whose developerMessage embeds the failing
// statement (`CREATE OR REPLACE VIEW …`). Since each modification's SQL is executed in isolation, that string
// is a precise signal that an in-place view update — and not some other statement — is what Postgres rejected.
const isViewReplaceFailure = (e: unknown): boolean =>
	Array.isArray(e) && e.some(it =>
		hasCode(it, MigrateErrorCode.MigrationFailed)
		&& 'message' in it
		&& typeof it.message === 'string'
		&& it.message.includes('CREATE OR REPLACE VIEW')
	)

const hasCode = (value: unknown, code: MigrateErrorCode): value is object & { code: MigrateErrorCode } =>
	value !== null && typeof value === 'object' && 'code' in value && value.code === code
