import { afterEach, beforeAll, beforeEach, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import chalk from 'chalk'
import { GraphQlClient, GraphQlClientError } from '@contember/graphql-client'
import {
	ExecutedMigrationInfo,
	isSchemaMigration,
	JsonLoader,
	MigrationDescriber,
	MigrationExecutor,
	MigrationFilesManager,
	MigrationParser,
	MigrationsResolver,
	MigrationsStatusResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	SchemaState,
	SchemaStateManager,
	SchemaVersionBuilder,
	SnapshotFile,
	SnapshotManager,
	SystemClient,
	VERSION_LATEST,
} from '@contember/migrations-client'
import { emptySchema } from '@contember/schema-utils'
import { c, createSchema } from '@contember/schema-definition'
import { calculateMigrationChecksum } from '@contember/schema-migrations'
import { CliError, ExitCode } from '@contember/cli-common'
import { MigrationExecutionFacade } from '../../../src/lib/migrations/MigrationExecutionFacade.js'
import { MigrationPrinter } from '../../../src/lib/migrations/MigrationPrinter.js'
import { MigrationSnapshotFacade } from '../../../src/lib/migrations/MigrationSnapshotFacade.js'
import { MigrationsStatusFacade } from '../../../src/lib/migrations/MigrationsStatusFacade.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { RemoteProjectProvider } from '../../../src/lib/project/RemoteProjectProvider.js'
import { SystemClientProvider } from '../../../src/lib/SystemClientProvider.js'
import { TenantClientProvider } from '../../../src/lib/TenantClientProvider.js'
import { TenantApiTransport } from '../../../src/lib/tenant/TenantApiTransport.js'
import { TenantCreateProjectDetails, TenantCreateProjectResult, TenantProjectClient } from '../../../src/lib/tenant/clients/TenantProjectClient.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import prompts from 'prompts'

type Event =
	| { type: 'create-project'; details: TenantCreateProjectDetails | undefined }
	| { type: 'list-executed' }
	| { type: 'snapshot-lookup' }
	| { type: 'snapshot-build' }
	| { type: 'snapshot-apply' }
	| { type: 'execute-migrations'; schemaState: SchemaState | undefined }

class RecordingSystemClient extends SystemClient {
	constructor(
		private readonly events: Event[],
		private readonly executedMigrations: ExecutedMigrationInfo[],
		private readonly missingUntilCreated: boolean,
	) {
		super(new GraphQlClient({ url: 'http://system.test', apiToken: 'token' }))
	}

	override async listExecutedMigrations(): Promise<ExecutedMigrationInfo[]> {
		this.events.push({ type: 'list-executed' })
		if (this.missingUntilCreated && !this.events.some(event => event.type === 'create-project')) {
			throw new GraphQlClientError(
				'Project not found',
				'bad request',
				{ url: 'http://system.test', query: '', variables: {} },
				new Response(null, { status: 404 }),
			)
		}
		return this.executedMigrations
	}

	override async migrateFromSnapshot(...args: Parameters<SystemClient['migrateFromSnapshot']>): Promise<void> {
		void args
		this.events.push({ type: 'snapshot-apply' })
	}
}

class RecordingSystemClientProvider extends SystemClientProvider {
	constructor(private readonly client: SystemClient) {
		super(new RemoteProjectProvider())
	}

	override get(): SystemClient {
		return this.client
	}
}

class RecordingTenantProjectClient extends TenantProjectClient {
	constructor(private readonly events: Event[]) {
		super(new TenantApiTransport(new GraphQlClient({ url: 'http://tenant.test', apiToken: 'token' })))
	}

	override async createProject(
		slug: string,
		ignoreExisting = false,
		details?: TenantCreateProjectDetails,
	): Promise<TenantCreateProjectResult | null> {
		void slug
		void ignoreExisting
		this.events.push({ type: 'create-project', details })
		return null
	}
}

class RecordingTenantClientProvider extends TenantClientProvider {
	constructor(private readonly client: TenantProjectClient) {
		super(new RemoteProjectProvider())
	}

	override get(): TenantProjectClient {
		return this.client
	}
}

class RecordingMigrationExecutor extends MigrationExecutor {
	constructor(private readonly events: Event[]) {
		super()
	}

	override async executeMigrations(args: Parameters<MigrationExecutor['executeMigrations']>[0]): Promise<void> {
		this.events.push({ type: 'execute-migrations', schemaState: args.schemaState })
	}
}

class RecordingSnapshotFacade extends MigrationSnapshotFacade {
	constructor(
		private readonly events: Event[],
		...args: ConstructorParameters<typeof MigrationSnapshotFacade>
	) {
		super(...args)
	}

	override async getUsableSnapshot(executedMigrations: ExecutedMigrationInfo[]): Promise<SnapshotFile | null> {
		this.events.push({ type: 'snapshot-lookup' })
		return super.getUsableSnapshot(executedMigrations)
	}

	override async buildSnapshotInput(snapshot: SnapshotFile): ReturnType<MigrationSnapshotFacade['buildSnapshotInput']> {
		this.events.push({ type: 'snapshot-build' })
		return super.buildSnapshotInput(snapshot)
	}
}

let workDir: string

namespace ExecutionModel {
	export class Article {
		title = c.stringColumn()
	}
}

beforeAll(() => {
	chalk.level = 0
})

beforeEach(async () => {
	workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-exec-'))
})

afterEach(async () => {
	await fs.rm(workDir, { recursive: true, force: true })
})

const createHarness = async (
	{ state = false, migration = false, snapshot = false, remoteExecuted = false, remoteMissing = false, stdinTty = false } = {},
) => {
	const events: Event[] = []
	const migrationsDir = path.join(workDir, 'migrations')
	const filesManager = new MigrationFilesManager(migrationsDir, { json: new JsonLoader(new MigrationParser()) })
	const modificationFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const schemaMigrator = new SchemaMigrator(modificationFactory)
	const schemaDiffer = new SchemaDiffer(schemaMigrator)
	if (migration) {
		await filesManager.createDirIfNotExist()
		await filesManager.createFile(
			JSON.stringify({ formatVersion: VERSION_LATEST, modifications: schemaDiffer.diffSchemas(emptySchema, createSchema(ExecutionModel)) }),
			'2024-01-01-120000-init',
		)
	}
	const migrationsResolver = new MigrationsResolver(filesManager)
	const stateManager = new SchemaStateManager(path.join(migrationsDir, 'state'))
	if (state) {
		await stateManager.extractState(emptySchema)
	}
	const schemaVersionBuilder = new SchemaVersionBuilder(migrationsResolver, schemaMigrator, stateManager)
	const snapshotManager = new SnapshotManager(path.join(migrationsDir, 'snapshot.json'))
	const io = createTestOutput({ stdinTty, stderrTty: stdinTty })
	const snapshotFacade = new RecordingSnapshotFacade(
		events,
		migrationsResolver,
		schemaVersionBuilder,
		schemaDiffer,
		schemaMigrator,
		stateManager,
		snapshotManager,
		io.output,
	)
	if (snapshot) {
		const prepared = await snapshotFacade.prepare()
		await snapshotFacade.write(prepared)
		events.splice(0)
	}
	const executedMigrations: ExecutedMigrationInfo[] = []
	if (remoteExecuted) {
		const [localMigration] = await migrationsResolver.getMigrationFiles()
		const content = await localMigration.getContent()
		if (!isSchemaMigration(content)) {
			throw new Error('Expected a schema migration')
		}
		executedMigrations.push({
			name: localMigration.name,
			version: localMigration.version,
			formatVersion: content.formatVersion,
			checksum: calculateMigrationChecksum(content),
			executedAt: new Date(0),
		})
	}
	const systemClient = new RecordingSystemClient(events, executedMigrations, remoteMissing)
	const systemProvider = new RecordingSystemClientProvider(systemClient)
	const tenantProvider = new RecordingTenantClientProvider(new RecordingTenantProjectClient(events))
	const projectProvider = new RemoteProjectProvider()
	projectProvider.setRemoteProject(new RemoteProject('project', 'http://api.test', 'token'))
	const migrationPrinter = new MigrationPrinter(new MigrationDescriber(modificationFactory), io.output)
	const statusFacade = new MigrationsStatusFacade(
		systemProvider,
		migrationsResolver,
		new MigrationsStatusResolver(),
		migrationPrinter,
		io.output,
	)
	const facade = new MigrationExecutionFacade(
		systemProvider,
		tenantProvider,
		projectProvider,
		schemaVersionBuilder,
		migrationPrinter,
		new RecordingMigrationExecutor(events),
		statusFacade,
		stateManager,
		snapshotFacade,
		io.output,
	)
	return { events, facade, io }
}

test('non-interactive state-only execution refuses before any mutation or request', async () => {
	const { facade, events } = await createHarness({ state: true })

	const error = await facade.execute({ requireConfirmation: true }).then(() => null, (reason: unknown) => reason)

	expect(error).toBeInstanceOf(CliError)
	expect(error instanceof CliError ? error.code : null).toBe('TTY_UNAVAILABLE')
	expect(error instanceof CliError ? error.exitCode : null).toBe(ExitCode.InputError)
	expect(events).toStrictEqual([])
})

test('declining state-only execution does not create a project or call the executor', async () => {
	const { facade, events } = await createHarness({ state: true, stdinTty: true })
	prompts.inject(['no'])

	const error = await facade.execute({ requireConfirmation: true }).then(() => null, (reason: unknown) => reason)

	expect(error instanceof CliError ? error.code : null).toBe('OPERATION_ABORTED')
	expect(events).toStrictEqual([])
})

test('does not notify confirmation when interactive execution is declined', async () => {
	const { facade } = await createHarness({ state: true, stdinTty: true })
	let confirmations = 0
	prompts.inject(['no'])

	await facade.execute({
		requireConfirmation: true,
		onConfirmed: () => {
			confirmations++
		},
	}).then(() => null, () => null)

	expect(confirmations).toBe(0)
})

test('does not notify confirmation when there is no migration work to confirm', async () => {
	const { facade, events } = await createHarness({ stdinTty: true })
	let confirmations = 0

	const result = await facade.execute({
		requireConfirmation: true,
		onConfirmed: () => {
			confirmations++
		},
	})

	expect(result).toBe(false)
	expect(confirmations).toBe(0)
	expect(events).toStrictEqual([])
})

test('an already-current project with local migrations returns without prompting or mutation', async () => {
	const { facade, events } = await createHarness({ migration: true, remoteExecuted: true })
	let confirmations = 0

	const result = await facade.execute({
		requireConfirmation: true,
		onConfirmed: () => {
			confirmations++
		},
	})

	expect(result).toBe(false)
	expect(confirmations).toBe(0)
	expect(events).toStrictEqual([{ type: 'list-executed' }])
})

test('declining with a usable snapshot neither builds nor applies it', async () => {
	const { facade, events } = await createHarness({ migration: true, snapshot: true, stdinTty: true })
	prompts.inject(['no'])

	const error = await facade.execute({ requireConfirmation: true }).then(() => null, (reason: unknown) => reason)

	expect(error instanceof CliError ? error.code : null).toBe('OPERATION_ABORTED')
	expect(events).toStrictEqual([{ type: 'list-executed' }])
})

test('confirmed snapshot execution creates a tokenless project before building and applying the snapshot', async () => {
	const { facade, events } = await createHarness({ migration: true, snapshot: true, remoteMissing: true, stdinTty: true })
	prompts.inject(['yes'])

	await facade.execute({ requireConfirmation: true })

	const types = events.map(event => event.type)
	expect(types.indexOf('list-executed')).toBeLessThan(types.indexOf('create-project'))
	expect(events.find(event => event.type === 'create-project')).toStrictEqual({
		type: 'create-project',
		details: { noDeployToken: true },
	})
	expect(types.indexOf('snapshot-build')).toBeGreaterThan(types.indexOf('create-project'))
	expect(types.indexOf('snapshot-apply')).toBeGreaterThan(types.indexOf('snapshot-build'))
	expect(types.indexOf('execute-migrations')).toBeGreaterThan(types.indexOf('snapshot-apply'))
})

test('confirmed state-only execution reaches the executor with schema state', async () => {
	const { facade, events } = await createHarness({ state: true, stdinTty: true })
	prompts.inject(['yes'])

	await facade.execute({ requireConfirmation: true })

	expect(events[0]).toStrictEqual({ type: 'create-project', details: { noDeployToken: true } })
	const execution = events.find(event => event.type === 'execute-migrations')
	expect(execution?.type === 'execute-migrations' ? execution.schemaState : undefined).toBeDefined()
})

test('notifies confirmation once after interactive execution is accepted', async () => {
	const { facade } = await createHarness({ state: true, stdinTty: true })
	let confirmations = 0
	prompts.inject(['yes'])

	await facade.execute({
		requireConfirmation: true,
		onConfirmed: () => {
			confirmations++
		},
	})

	expect(confirmations).toBe(1)
})
