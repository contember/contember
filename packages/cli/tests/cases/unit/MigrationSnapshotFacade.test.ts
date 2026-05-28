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
import { MigrationSnapshotFacade } from '../../../src/lib/migrations/MigrationSnapshotFacade'

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
	)
	return { facade, schemaDiffer, snapshotManager }
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

	test('create collapses all migrations and records what they cover', async () => {
		const snapshot = await (await freshFacade()).create()

		expect(snapshot.version).toBe('2024-01-03-120000')
		expect(snapshot.covers.map(it => it.type)).toStrictEqual(['schema', 'schema', 'content'])
		expect(snapshot.covers[0].checksum).toBeString()
		expect(snapshot.covers[2].checksum).toBeNull()
		// the content migration is flagged: its data is not reproduced by the schema snapshot
		expect(snapshot.contentMigrations).toStrictEqual(['2024-01-03-120000'])
		expect(snapshot.snapshot.modifications.length).toBeGreaterThan(0)
	})

	test('a freshly created snapshot verifies against a full replay', async () => {
		await (await freshFacade()).create()
		const result = await (await freshFacade()).verify()
		expect(result.ok).toBe(true)
	})

	test('verify fails when a covered migration changed after the snapshot', async () => {
		await (await freshFacade()).create()
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
		await (await freshFacade()).create()
		expect(await (await freshFacade()).getUsableSnapshot([])).not.toBeNull()
	})

	test('getUsableSnapshot returns null when the project already has executed migrations', async () => {
		await (await freshFacade()).create()
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
		await (await freshFacade()).create()
		await fs.rm(path.join(migrationsDir, '2024-01-01-120000-a.json'))
		expect(await (await freshFacade()).getUsableSnapshot([])).toBeNull()
	})

	test('buildSnapshotInput maps covered migrations to GraphQL inputs', async () => {
		const facade = await freshFacade()
		const snapshot = await facade.create()
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
