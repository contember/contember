import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { c, createSchema } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import {
	JsonLoader,
	MigrationFilesManager,
	MigrationParser,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	SchemaStateManager,
	SchemaVersionBuilder,
	SnapshotManager,
	VERSION_LATEST,
} from '@contember/migrations-client'
import { MigrationSnapshotFacade } from '../../../src/lib/migrations/MigrationSnapshotFacade.js'
import { MigrationSnapshotCommand } from '../../../src/commands/migrations/MigrationSnapshotCommand.js'
import { CliError, ExitCode } from '@contember/cli-common'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import prompts from 'prompts'

namespace ModelA {
	export class Author {
		name = c.stringColumn()
	}
}

namespace ModelB {
	export class Author {
		name = c.stringColumn()
	}

	export class Category {
		title = c.stringColumn()
	}
}

namespace WithRelation {
	export class Author {
		name = c.stringColumn()
		posts = c.oneHasMany(Post, 'author')
	}

	export class Post {
		title = c.stringColumn()
		author = c.manyHasOne(Author, 'posts').notNull()
	}
}

namespace WithRelationAndColumn {
	export class Author {
		name = c.stringColumn()
		// added after `posts` already exists — a replay orders Author.fields as [..., posts, nickname]
		// while the collapsed differ emits columns before relations: [..., nickname, posts].
		nickname = c.stringColumn()
		posts = c.oneHasMany(Post, 'author')
	}

	export class Post {
		title = c.stringColumn()
		author = c.manyHasOne(Author, 'posts').notNull()
	}
}

const setup = async (migrationsDir: string) => {
	const filesManager = new MigrationFilesManager(migrationsDir, { json: new JsonLoader(new MigrationParser()) })
	const migrationsResolver = new MigrationsResolver(filesManager)
	const schemaMigrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
	const schemaStateManager = new SchemaStateManager(path.join(migrationsDir, 'state'))
	const schemaVersionBuilder = new SchemaVersionBuilder(migrationsResolver, schemaMigrator, schemaStateManager)
	const schemaDiffer = new SchemaDiffer(schemaMigrator)
	const snapshotManager = new SnapshotManager(path.join(migrationsDir, 'snapshot.json'))
	const facade = new MigrationSnapshotFacade(
		migrationsResolver,
		schemaVersionBuilder,
		schemaDiffer,
		schemaMigrator,
		schemaStateManager,
		snapshotManager,
		createTestOutput().output,
	)
	return { facade, schemaDiffer, snapshotManager, command: new MigrationSnapshotCommand(facade) }
}

const writeSnapshot = async (facade: MigrationSnapshotFacade) => {
	const snapshot = await facade.prepare()
	await facade.write(snapshot)
	return snapshot
}

describe('MigrationSnapshotFacade', () => {
	let migrationsDir: string

	// Each call mints a facade with a fresh MigrationFilesManager cache, simulating a new CLI process.
	const freshFacade = async () => (await setup(migrationsDir)).facade

	beforeEach(async () => {
		migrationsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-snapshot-facade-'))
		const { schemaDiffer } = await setup(migrationsDir)

		const schemaA = createSchema(ModelA)
		const schemaB = createSchema(ModelB)
		const write = (name: string, content: unknown) => fs.writeFile(path.join(migrationsDir, name), JSON.stringify(content, null, '\t'))

		await write('2024-01-01-120000-a.json', { formatVersion: VERSION_LATEST, modifications: schemaDiffer.diffSchemas(emptySchema, schemaA) })
		await write('2024-01-02-120000-b.json', { formatVersion: VERSION_LATEST, modifications: schemaDiffer.diffSchemas(schemaA, schemaB) })
		await write('2024-01-03-120000-seed.json', { queries: [{ query: 'query { __typename }' }] })
	})

	afterEach(async () => {
		await fs.rm(migrationsDir, { recursive: true, force: true })
	})

	test('prepare and write collapse all migrations and record what they cover', async () => {
		const snapshot = await writeSnapshot(await freshFacade())

		expect(snapshot.version).toBe('2024-01-03-120000')
		expect(snapshot.covers.map(it => it.type)).toStrictEqual(['schema', 'schema', 'content'])
		expect(snapshot.covers[0].checksum).toBeString()
		expect(snapshot.covers[2].checksum).toBeNull()
		// the content migration is flagged: its data is not reproduced by the schema snapshot
		expect(snapshot.contentMigrations).toStrictEqual(['2024-01-03-120000'])
		expect(snapshot.snapshot.modifications.length).toBeGreaterThan(0)
	})

	test('prepare is read-only until the caller writes the snapshot', async () => {
		const { facade, snapshotManager } = await setup(migrationsDir)

		await facade.prepare()

		expect(await snapshotManager.exists()).toBe(false)
	})

	test('non-interactive snapshot refusal does not write and returns an input error', async () => {
		const { command, snapshotManager } = await setup(migrationsDir)
		const { output } = createTestOutput({ stdinTty: false })

		const error = await command.run([], output).then(() => null, (reason: unknown) => reason)

		expect(error).toBeInstanceOf(CliError)
		expect(error instanceof CliError ? error.code : null).toBe('TTY_UNAVAILABLE')
		expect(error instanceof CliError ? error.exitCode : null).toBe(ExitCode.InputError)
		expect(await snapshotManager.exists()).toBe(false)
	})

	test('declining snapshot creation does not write', async () => {
		const { command, snapshotManager } = await setup(migrationsDir)
		const { output } = createTestOutput({ stdinTty: true, stderrTty: true })
		prompts.inject([false])

		const error = await command.run([], output).then(() => null, (reason: unknown) => reason)

		expect(error instanceof CliError ? error.code : null).toBe('OPERATION_ABORTED')
		expect(await snapshotManager.exists()).toBe(false)
	})

	test('confirmed snapshot writes once and emits structured JSON with a quiet path', async () => {
		const jsonSetup = await setup(migrationsDir)
		const json = createTestOutput()
		await jsonSetup.command.run(['--yes', '--json'], json.output)

		expect(JSON.parse(json.stdout.text)).toStrictEqual({
			version: '2024-01-03-120000',
			coveredMigrations: 3,
			contentMigrations: ['2024-01-03-120000'],
			path: 'snapshot.json',
		})
		expect(await jsonSetup.snapshotManager.exists()).toBe(true)

		await fs.rm(path.join(migrationsDir, 'snapshot.json'))
		const quietSetup = await setup(migrationsDir)
		const quiet = createTestOutput()
		await quietSetup.command.run(['--yes', '--quiet'], quiet.output)
		expect(quiet.stdout.text).toBe('snapshot.json\n')
	})

	test('a freshly created snapshot verifies against a full replay', async () => {
		await writeSnapshot(await freshFacade())
		const result = await (await freshFacade()).verify()
		expect(result.ok).toBe(true)
	})

	test('verify tolerates schema key-order differences between a replay and the collapsed snapshot', async () => {
		// History adds a column to an entity that already has a relation. A replay orders the entity's
		// fields as [..., relation, column]; the collapsed differ orders them [..., column, relation].
		// The two schemas are deeply equal but their JSON checksums differ — verify must not report a
		// false mismatch (it compares order-insensitively, like SchemaDiffer's own round-trip check).
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-snapshot-rel-'))
		try {
			const { schemaDiffer } = await setup(dir)
			const a = createSchema(WithRelation)
			const b = createSchema(WithRelationAndColumn)
			const write = (name: string, content: unknown) => fs.writeFile(path.join(dir, name), JSON.stringify(content, null, '\t'))
			await write('2024-01-01-120000-a.json', { formatVersion: VERSION_LATEST, modifications: schemaDiffer.diffSchemas(emptySchema, a) })
			await write('2024-01-02-120000-b.json', { formatVersion: VERSION_LATEST, modifications: schemaDiffer.diffSchemas(a, b) })

			await writeSnapshot((await setup(dir)).facade)
			const result = await (await setup(dir)).facade.verify()
			expect(result.ok).toBe(true)
		} finally {
			await fs.rm(dir, { recursive: true, force: true })
		}
	})

	test('verify fails when a covered migration changed after the snapshot', async () => {
		await writeSnapshot(await freshFacade())
		// tamper with a covered schema migration, then re-read from a fresh process
		await fs.writeFile(
			path.join(migrationsDir, '2024-01-02-120000-b.json'),
			JSON.stringify({ formatVersion: VERSION_LATEST, modifications: [] }, null, '\t'),
		)

		const result = await (await freshFacade()).verify()
		expect(result.ok).toBe(false)
		expect(result.message).toMatch(/stale/)
	})

	test('getUsableSnapshot returns the snapshot for an empty project', async () => {
		await writeSnapshot(await freshFacade())
		expect(await (await freshFacade()).getUsableSnapshot([])).not.toBeNull()
	})

	test('getUsableSnapshot returns null when the project already has executed migrations', async () => {
		await writeSnapshot(await freshFacade())
		const executed = [{
			version: '2024-01-01-120000',
			name: '2024-01-01-120000-a',
			formatVersion: VERSION_LATEST,
			checksum: 'x',
			executedAt: new Date(),
		}]
		expect(await (await freshFacade()).getUsableSnapshot(executed as any)).toBeNull()
	})

	test('getUsableSnapshot returns null (with a warning) when a covered migration is stale', async () => {
		await writeSnapshot(await freshFacade())
		await fs.rm(path.join(migrationsDir, '2024-01-01-120000-a.json'))
		expect(await (await freshFacade()).getUsableSnapshot([])).toBeNull()
	})

	test('getUsableSnapshot ignores the snapshot when a migration was added within the covered range', async () => {
		await writeSnapshot(await freshFacade())
		// a migration whose version falls between two covered migrations, added without regenerating the
		// snapshot. Bootstrapping would then fail with MUST_FOLLOW_LATEST, so it must fall back to replay.
		await fs.writeFile(
			path.join(migrationsDir, '2024-01-01-130000-inrange.json'),
			JSON.stringify({ formatVersion: VERSION_LATEST, modifications: [] }, null, '\t'),
		)
		expect(await (await freshFacade()).getUsableSnapshot([])).toBeNull()

		const result = await (await freshFacade()).verify()
		expect(result.ok).toBe(false)
		expect(result.message).toMatch(/within the covered range/)
	})

	test('verify fails when a covered migration changed type', async () => {
		const { schemaDiffer } = await setup(migrationsDir)
		await writeSnapshot(await freshFacade())
		// the seed migration was recorded as a content cover; rewrite it into a schema migration. Its
		// modifications are absent from the collapsed snapshot, so it no longer equals a full replay.
		await fs.writeFile(
			path.join(migrationsDir, '2024-01-03-120000-seed.json'),
			JSON.stringify(
				{ formatVersion: VERSION_LATEST, modifications: schemaDiffer.diffSchemas(createSchema(ModelB), createSchema(ModelA)) },
				null,
				'\t',
			),
		)

		expect(await (await freshFacade()).getUsableSnapshot([])).toBeNull()
		const result = await (await freshFacade()).verify()
		expect(result.ok).toBe(false)
		expect(result.message).toMatch(/changed type/)
	})

	test('verify fails when schema state mode was toggled after the snapshot', async () => {
		await writeSnapshot(await freshFacade())
		// enabling state mode (migrations:init-state) only creates the state/ dir — it leaves the covered
		// migration files untouched, so without an explicit guard the snapshot would pass unnoticed.
		await fs.mkdir(path.join(migrationsDir, 'state'), { recursive: true })

		expect(await (await freshFacade()).getUsableSnapshot([])).toBeNull()
		const result = await (await freshFacade()).verify()
		expect(result.ok).toBe(false)
		expect(result.message).toMatch(/state mode changed/)
	})

	test('buildSnapshotInput maps covered migrations to GraphQL inputs', async () => {
		const facade = await freshFacade()
		const snapshot = await writeSnapshot(facade)
		const input = await facade.buildSnapshotInput(snapshot)

		expect(input.covers).toHaveLength(3)
		const schemaCover = input.covers[0] as any
		expect(schemaCover.type).toBe('SCHEMA')
		expect(schemaCover.schemaMigration.modifications.length).toBeGreaterThan(0)
		const contentCover = input.covers[2] as any
		expect(contentCover.type).toBe('CONTENT')
		expect(contentCover.contentMigration).toStrictEqual([])
	})
})
