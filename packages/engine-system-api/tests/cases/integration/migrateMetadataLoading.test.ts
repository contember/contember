import { expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import crypto from 'node:crypto'
import { c, createSchema } from '@contember/schema-definition'
import { Model, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import {
	Migration,
	MigrationDescriber,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	updateColumnNameModification,
	updateEntityTableNameModification,
	updateFieldNameModification,
	VERSION_LATEST,
} from '@contember/schema-migrations'
import { Connection, DatabaseMetadataResolver, EventManager } from '@contember/database'
import { createLogger, NullLoggerHandler } from '@contember/logger'
import {
	ContentQueryExecutor,
	CreateStageCommand,
	DatabaseContextFactory,
	ExecutedMigrationsResolver,
	MigrationsDatabaseMetadataResolverStoreFactory,
	ProjectMigrator,
	SchemaProvider,
	StagesQuery,
} from '../../../src/model/index.js'
import { SystemMigrationsRunner } from '../../../src/migrations/index.js'
import { SchemaMigrationInput } from '../../../src/model/migrations/MigrationInput.js'

// Pins the DDL `migrate` emits when a metadata reader (removeIndex, removeUniqueConstraint, updateRelationOnDelete)
// follows a rename that does not invalidate the cached metadata, deployed together or one migration per call.
const databaseUrl = process.env.MIGRATION_TEST_DATABASE_URL
const databaseTest = test.skipIf(!databaseUrl)

const handlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
const schemaMigrator = new SchemaMigrator(handlerFactory)
const differ = new SchemaDiffer(schemaMigrator)

const noContentQueries: ContentQueryExecutor = {
	execute: () => Promise.reject(new Error('content migrations are not used here')),
}

const connectionConfig = (database: string) => {
	if (!databaseUrl) {
		throw new Error('Set MIGRATION_TEST_DATABASE_URL to a local PostgreSQL server')
	}
	const url = new URL(databaseUrl)
	return {
		host: url.hostname,
		port: Number(url.port || 5432),
		user: decodeURIComponent(url.username),
		password: decodeURIComponent(url.password),
		database,
	}
}

type DeployResult = {
	/** Stage SQL per deploy, without the search_path prefix. */
	sql: string[][]
	/** Indexes and FK/unique constraints of the stage after all deploys. */
	catalog: string[]
}

const deploy = async (label: string, deploys: readonly (readonly SchemaMigrationInput[])[]): Promise<DeployResult> => {
	const db = connectionConfig(`mml_${label}_${crypto.randomBytes(4).toString('hex')}`)
	const stages = [{ slug: 'live', name: 'live' }]
	const project = { slug: 'test', stages, systemSchema: 'system', db }
	const dbContextFactory = new DatabaseContextFactory('system', { uuid: () => crypto.randomUUID() })
	const executedMigrationsResolver = new ExecutedMigrationsResolver()
	const schemaProvider = new SchemaProvider(executedMigrationsResolver, schemaMigrator)
	await new SystemMigrationsRunner(dbContextFactory, project, schemaProvider, {}, new DatabaseMetadataResolver())
		.run(createLogger(new NullLoggerHandler()))

	const connection = Connection.create(db, error => {
		throw error
	})
	try {
		const dbContext = dbContextFactory.create(connection)
		await dbContext.transaction(async trx => {
			for (const stage of stages) {
				await trx.commandBus.execute(new CreateStageCommand(stage))
			}
		})
		const migrator = new ProjectMigrator(
			new MigrationDescriber(handlerFactory),
			schemaProvider,
			executedMigrationsResolver,
			new MigrationsDatabaseMetadataResolverStoreFactory(new DatabaseMetadataResolver()),
			noContentQueries,
		)
		const sql: string[][] = []
		for (const migrations of deploys) {
			const statements: string[] = []
			await dbContext.transaction(async trx => {
				trx.client.eventManager.on(EventManager.Event.queryEnd, query => {
					const prefix = 'SET LOCAL search_path TO "stage_live";\n'
					if (query.sql.startsWith(prefix) && query.sql.length > prefix.length) {
						statements.push(query.sql.slice(prefix.length).trim())
					}
				})
				await migrator.migrate({
					db: trx,
					project,
					identity: { id: '00000000-0000-0000-0000-000000000000' },
					stages: await trx.queryHandler.fetch(new StagesQuery()),
					migrationsToExecute: migrations,
					options: {},
				})
			})
			sql.push(statements)
		}
		const indexes = await connection.query<{ def: string }>(
			`SELECT indexdef AS def FROM pg_indexes WHERE schemaname = 'stage_live' ORDER BY tablename, indexname`,
		)
		const constraints = await connection.query<{ def: string }>(
			`SELECT conrelid::regclass::text || ' ' || conname || ' ' || pg_get_constraintdef(oid) AS def
			FROM pg_constraint WHERE connamespace = 'stage_live'::regnamespace AND contype IN ('f', 'u')
			ORDER BY conrelid::regclass::text, conname`,
		)
		return { sql, catalog: [...indexes.rows, ...constraints.rows].map(it => it.def) }
	} finally {
		await connection.end()
	}
}

let versionCounter = 0
const migration = (modifications: Migration.Modification[]): SchemaMigrationInput => {
	const version = `2026-01-01-${String(100000 + versionCounter++)}`
	return { type: 'schema', version, name: `${version}-m`, formatVersion: VERSION_LATEST, modifications }
}

const apply = (schema: Schema, modifications: Migration.Modification[]) => schemaMigrator.applyModifications(schema, modifications, VERSION_LATEST)

/** Three migrations: create, rename (no metadata invalidation), then a metadata reader on the renamed object. */
const renameThenRead = (initial: Schema, rename: Migration.Modification, target: (renamed: Schema) => Schema) => {
	const create = differ.diffSchemas(emptySchema, initial)
	const renamed = apply(initial, [rename])
	const read = differ.diffSchemas(renamed, target(renamed))
	return [migration(create), migration([rename]), migration(read)] as const
}

const deployBothWays = async (
	label: string,
	[create, rename, read]: readonly [SchemaMigrationInput, SchemaMigrationInput, SchemaMigrationInput],
) => ({
	together: await deploy(`${label}_together`, [[create], [rename, read]]),
	separately: await deploy(`${label}_separately`, [[create], [rename], [read]]),
})

namespace IndexedArticle {
	@c.Index('title')
	export class Article {
		title = c.stringColumn()
	}
}

namespace UniqueArticle {
	@c.Unique('code')
	export class Article {
		code = c.stringColumn()
	}
}

namespace ArticleWithAuthor {
	export class Article {
		title = c.stringColumn()
		author = c.manyHasOne(Author)
	}

	export class Author {
		name = c.stringColumn()
	}
}

const withoutIndexes = (entityName: string) => (schema: Schema): Schema => ({
	...schema,
	model: {
		...schema.model,
		entities: { ...schema.model.entities, [entityName]: { ...schema.model.entities[entityName], indexes: [] } },
	},
})

const withoutUniques = (entityName: string) => (schema: Schema): Schema => ({
	...schema,
	model: {
		...schema.model,
		entities: { ...schema.model.entities, [entityName]: { ...schema.model.entities[entityName], unique: [] } },
	},
})

const withCascadingAuthor = (schema: Schema): Schema => {
	const article = schema.model.entities.Article
	const author = article.fields.author
	if (author.type !== Model.RelationType.ManyHasOne) {
		throw new Error('expected a ManyHasOne author')
	}
	return {
		...schema,
		model: {
			...schema.model,
			entities: {
				...schema.model.entities,
				Article: {
					...article,
					fields: { ...article.fields, author: { ...author, joiningColumn: { ...author.joiningColumn, onDelete: Model.OnDelete.cascade } } },
				},
			},
		},
	}
}

databaseTest('rename a field, then remove its index', async () => {
	const result = await deployBothWays(
		'index',
		renameThenRead(
			createSchema(IndexedArticle),
			updateFieldNameModification.createModification({ entityName: 'Article', fieldName: 'title', newFieldName: 'headline', columnName: 'headline' }),
			withoutIndexes('Article'),
		),
	)
	expect(result).toMatchSnapshot()
})

databaseTest('rename a field, then remove its unique constraint', async () => {
	const result = await deployBothWays(
		'unique',
		renameThenRead(
			createSchema(UniqueArticle),
			updateFieldNameModification.createModification({ entityName: 'Article', fieldName: 'code', newFieldName: 'slug', columnName: 'slug' }),
			withoutUniques('Article'),
		),
	)
	expect(result).toMatchSnapshot()
})

databaseTest('rename a table, then change a relation onDelete', async () => {
	const result = await deployBothWays(
		'table',
		renameThenRead(
			createSchema(ArticleWithAuthor),
			updateEntityTableNameModification.createModification({ entityName: 'Article', tableName: 'post' }),
			withCascadingAuthor,
		),
	)
	expect(result).toMatchSnapshot()
})

databaseTest('rename a joining column, then change the relation onDelete', async () => {
	const result = await deployBothWays(
		'column',
		renameThenRead(
			createSchema(ArticleWithAuthor),
			updateColumnNameModification.createModification({ entityName: 'Article', fieldName: 'author', columnName: 'writer_id' }),
			withCascadingAuthor,
		),
	)
	expect(result).toMatchSnapshot()
})

const playgroundMigrationsDir = join(import.meta.dir, '../../../../playground/api/migrations')

const playgroundHistory = (): SchemaMigrationInput[] =>
	readdirSync(playgroundMigrationsDir)
		.filter(it => it.endsWith('.json'))
		.sort()
		.map(file => {
			const name = file.slice(0, -'.json'.length)
			const content: { formatVersion: number; modifications: Migration.Modification[] } = JSON.parse(
				readFileSync(join(playgroundMigrationsDir, file), 'utf8'),
			)
			return { type: 'schema', version: name.slice(0, 17), name, formatVersion: content.formatVersion, modifications: content.modifications }
		})

databaseTest('replaying the playground history in one call or one migration per call', async () => {
	const history = playgroundHistory()
	const together = await deploy('playground_together', [history])
	const separately = await deploy('playground_separately', history.map(it => [it]))
	expect(together.catalog).toEqual(separately.catalog)
	expect(together.sql.flat()).toEqual(separately.sql.flat())
	expect(together).toMatchSnapshot()
}, 120_000)
