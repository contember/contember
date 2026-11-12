import { expect, test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { MigrationDescriber, ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { Connection, DatabaseMetadataResolver } from '@contember/database'
import { ConnectionMock } from '@contember/database-tester'
import crypto from 'node:crypto'
import {
	ContentQueryExecutor,
	DatabaseContextFactory,
	ExecutedMigrationsResolver,
	MigrationsDatabaseMetadataResolverStoreFactory,
	ProjectMigrator,
	SchemaProvider,
	Stage,
} from '../../../src/model/index.js'
import { SchemaMigrationInput } from '../../../src/model/migrations/MigrationInput.js'

namespace Model {
	@c.Unique('title')
	@c.Index('title')
	export class Article {
		title = c.stringColumn()
		author = c.manyHasOne(Author)
	}

	export class Author {
		name = c.stringColumn()
	}
}

const handlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
const schemaMigrator = new SchemaMigrator(handlerFactory)
const modifications = new SchemaDiffer(schemaMigrator).diffSchemas(emptySchema, createSchema(Model))
const migration: SchemaMigrationInput = {
	type: 'schema',
	version: '2026-01-01-100000',
	name: '2026-01-01-100000-init',
	formatVersion: VERSION_LATEST,
	modifications,
}
const stages: Stage[] = [
	{ id: crypto.randomUUID(), name: 'live', slug: 'live', schema: 'stage_live' },
	{ id: crypto.randomUUID(), name: 'preview', slug: 'preview', schema: 'stage_preview' },
]
const project = { slug: 'test', systemSchema: 'system' }

/** Answers every statement with no rows and keeps the SQL it was sent. */
class RecordingConnection extends ConnectionMock {
	public readonly statements: string[] = []

	constructor() {
		super([])
	}

	override async query<Row extends Record<string, unknown>>(sql: string): Promise<Connection.Result<Row>> {
		this.statements.push(sql)
		return { rows: [], rowCount: 0 }
	}

	override async scope<Result>(callback: (connection: Connection.TransactionLike) => Promise<Result> | Result): Promise<Result> {
		return await callback(this)
	}

	override async transaction<Result>(callback: (connection: Connection.TransactionLike) => Promise<Result> | Result): Promise<Result> {
		return await callback(this)
	}
}

const noContentQueries: ContentQueryExecutor = {
	execute: () => Promise.reject(new Error('content migrations are not used here')),
}

const createMigrator = () => {
	const executedMigrationsResolver = new ExecutedMigrationsResolver()
	return new ProjectMigrator(
		new MigrationDescriber(handlerFactory),
		new SchemaProvider(executedMigrationsResolver, schemaMigrator),
		executedMigrationsResolver,
		new MigrationsDatabaseMetadataResolverStoreFactory(new DatabaseMetadataResolver()),
		noContentQueries,
	)
}

const createDb = (connection: RecordingConnection) => new DatabaseContextFactory('system', { uuid: () => crypto.randomUUID() }).create(connection)

const catalogReadsOf = (connection: RecordingConnection) => connection.statements.filter(it => /FROM pg_constraint/.test(it)).length

const stageDdlOf = (connection: RecordingConnection) => connection.statements.filter(it => it.startsWith('SET LOCAL search_path TO "stage_'))

test('a snapshot of creates is applied without reading database metadata', async () => {
	const connection = new RecordingConnection()
	await createMigrator().migrateFromSnapshot({
		db: createDb(connection),
		project,
		stages,
		snapshot: { formatVersion: VERSION_LATEST, modifications },
		covers: [migration],
	})
	expect(stageDdlOf(connection)).toHaveLength(modifications.length * stages.length)
	expect(catalogReadsOf(connection)).toBe(0)
})

test('migrate of creates does not read database metadata either', async () => {
	const connection = new RecordingConnection()
	await createMigrator().migrate({
		db: createDb(connection),
		project,
		identity: { id: '00000000-0000-0000-0000-000000000000' },
		stages,
		migrationsToExecute: [migration],
		options: {},
	})
	expect(stageDdlOf(connection)).toHaveLength(modifications.length * stages.length)
	expect(catalogReadsOf(connection)).toBe(0)
})
