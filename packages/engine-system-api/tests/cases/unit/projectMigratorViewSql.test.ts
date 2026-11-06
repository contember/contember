import { expect, test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import {
	calculateMigrationChecksum,
	createViewModification,
	MigrationDescriber,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	VERSION_CORRECT_PRIMARY_COLUMN_NAME,
} from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { Schema } from '@contember/schema'
import { Connection, DatabaseMetadataResolver } from '@contember/database'
import { ConnectionMock } from '@contember/database-tester'
import crypto from 'node:crypto'
import {
	ContentQueryExecutor,
	DatabaseContextFactory,
	ExecutedMigration,
	ExecutedMigrationsResolver,
	InvalidSchemaError,
	MigrationsDatabaseMetadataResolverStoreFactory,
	ProjectMigrator,
	SchemaProvider,
	SchemaWithMeta,
} from '../../../src/model/index.js'
import { SchemaMigrationInput } from '../../../src/model/migrations/MigrationInput.js'

namespace Base {
	export class Article {
		title = c.stringColumn()
	}
}

namespace WithView {
	export class Article {
		title = c.stringColumn()
	}

	@c.View('SELECT id, title FROM article; DELETE FROM article')
	export class ArticleView {
		title = c.stringColumn()
	}
}

namespace WithViewAndIndex {
	@c.Index({ fields: ['title'], where: "title <> ';'" })
	export class Article {
		title = c.stringColumn()
	}

	@c.View('SELECT id, title FROM article; DELETE FROM article')
	export class ArticleView {
		title = c.stringColumn()
	}
}

const formatVersion = VERSION_CORRECT_PRIMARY_COLUMN_NAME
const handlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
const schemaMigrator = new SchemaMigrator(handlerFactory)
const differ = new SchemaDiffer(schemaMigrator)

// Built by hand: the differ refuses to add a multi-statement view, as it should for new migrations.
const multiStatementViewMigration: SchemaMigrationInput = {
	type: 'schema',
	version: '2026-01-01-100000',
	name: '2026-01-01-100000-view',
	formatVersion,
	modifications: [
		...differ.diffSchemas(emptySchema, createSchema(Base)),
		createViewModification.createModification({ entity: createSchema(WithView).model.entities.ArticleView }),
	],
}

const indexMigration: SchemaMigrationInput = {
	type: 'schema',
	version: '2026-01-02-100000',
	name: '2026-01-02-100000-index',
	formatVersion,
	modifications: differ.diffSchemas(createSchema(WithView), createSchema(WithViewAndIndex)),
}

class FixedSchemaProvider extends SchemaProvider {
	constructor(private readonly result: SchemaWithMeta) {
		super(new ExecutedMigrationsResolver(), schemaMigrator)
	}

	override async fetch(): Promise<SchemaWithMeta> {
		return this.result
	}
}

class FixedExecutedMigrationsResolver extends ExecutedMigrationsResolver {
	constructor(private readonly migrations: ExecutedMigration[]) {
		super()
	}

	override async getMigrations(): Promise<ExecutedMigration[]> {
		return this.migrations
	}
}

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

const createMigrator = (stored: SchemaWithMeta, executedMigrations: ExecutedMigration[]) =>
	new ProjectMigrator(
		new MigrationDescriber(handlerFactory),
		new FixedSchemaProvider(stored),
		new FixedExecutedMigrationsResolver(executedMigrations),
		new MigrationsDatabaseMetadataResolverStoreFactory(new DatabaseMetadataResolver()),
		noContentQueries,
	)

const createDb = (connection: RecordingConnection) => new DatabaseContextFactory('system', { uuid: () => crypto.randomUUID() }).create(connection)

const savedMigrationsOf = (connection: RecordingConnection) =>
	connection.statements.filter(it => /^insert into\s+"system"\."schema_migration"/.test(it))

const migrate = async ({ executed, migrationsToExecute }: { executed: SchemaMigrationInput[]; migrationsToExecute: SchemaMigrationInput[] }) => {
	const storedSchema: Schema = executed.reduce(
		(schema, it) => schemaMigrator.applyModifications(schema, it.modifications, it.formatVersion),
		emptySchema,
	)
	const latest = executed[executed.length - 1]
	const executedMigrations = executed.map((it, i) =>
		new ExecutedMigration(i + 1, it.name, it.formatVersion, [...it.modifications], new Date(), calculateMigrationChecksum(it), 'schema')
	)
	const migrator = createMigrator({
		schema: storedSchema,
		meta: latest ? { id: 1, version: latest.version, checksum: '', updatedAt: new Date() } : {},
	}, executedMigrations)
	const connection = new RecordingConnection()
	await migrator.migrate({
		db: createDb(connection),
		project: { slug: 'test', systemSchema: 'system' },
		identity: { id: '00000000-0000-0000-0000-000000000000' },
		stages: [],
		migrationsToExecute,
		options: { skipExecuted: true },
	})
	return savedMigrationsOf(connection)
}

test('an executed multi-statement view migration does not block a later deploy', async () => {
	const savedMigrations = await migrate({
		executed: [multiStatementViewMigration],
		migrationsToExecute: [multiStatementViewMigration, indexMigration],
	})
	expect(savedMigrations).toHaveLength(1)
})

test('a multi-statement view migration about to be executed is rejected before anything runs', async () => {
	const result = migrate({ executed: [], migrationsToExecute: [multiStatementViewMigration] })
	await expect(result).rejects.toBeInstanceOf(InvalidSchemaError)
	await expect(result).rejects.toThrow('entities.ArticleView: [MODEL_INVALID_VIEW] View SQL must be a single SQL statement.')
})
