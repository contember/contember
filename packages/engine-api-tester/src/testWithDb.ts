import { Schema } from '@contember/schema'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '@contember/schema-migrations'
import { AllowAllPermissionFactory, emptySchema, Providers } from '@contember/schema-utils'
import { Client, DatabaseMetadataResolver, SelectBuilder, emptyDatabaseMetadata } from '@contember/database'
import { assert } from 'vitest'
import { createLogger, NullLoggerHandler, withLogger } from '@contember/logger'
import {
	Authorizator,
	Context as ContentContext,
	ExecutionContainerFactory,
	GraphQlSchemaBuilderFactory,
} from '@contember/engine-content-api'
import { MigrationGroup } from '@contember/database-migrations'
import { createUuidGenerator } from './testUuid'
import {
	DatabaseContextFactory,
	ProjectInitializer,
	StageBySlugQuery,
	StageCreator,
	SystemContainerFactory,
	SystemMigrationsRunner,
} from '@contember/engine-system-api'
import { createConnection, dbCredentials, recreateDatabase } from './dbUtils'
import { GraphQLSchema, graphql } from 'graphql'

type DatabaseExpectation = Record<string, Record<string, any>[]>
type Test = {
	schema: Partial<Schema>
	seed: {
		query: string
		queryVariables?: Record<string, any>
	}[]
	query: string
	queryVariables?: Record<string, any>
	expectDatabase?: DatabaseExpectation
	expectSystemDatabase?: DatabaseExpectation
	executionContainerFactoryFactory?: (providers: Providers) => ExecutionContainerFactory
	migrationGroups?: Record<string, MigrationGroup<unknown>>
} & ({ return: object | ((response: any) => void) } | { throws: { message: string } })

export const executeDbTest = async (test: Test) => {
	const modificationFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const schemaMigrator = new SchemaMigrator(modificationFactory)
	const schemaDiffer = new SchemaDiffer(schemaMigrator)
	const schema = {
		...emptySchema,
		...test.schema,
	}
	const modifications = schemaDiffer.diffSchemas(emptySchema, schema)


	const uuidGenerator = createUuidGenerator('a456')
	const providers = { uuid: uuidGenerator, now: () => new Date('2019-09-04 12:00') }

	const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const systemContainerFactory = new SystemContainerFactory(providers, modificationHandlerFactory)
	let systemContainerBuilder = systemContainerFactory.createBuilder({
		identityFetcher: {
			fetchIdentities: () => {
				return Promise.resolve([])
			},
		},
	})
	const systemContainer = systemContainerBuilder.build()

	const dbName = String(process.env.TEST_DB_NAME + Date.now().toString())

	const projectDbCredentials = dbCredentials(dbName)
	const connection = await recreateDatabase(projectDbCredentials)
	await connection.end()

	const projectConnection = createConnection(projectDbCredentials)
	const databaseContextFactory = new DatabaseContextFactory('system', providers)
	const db = databaseContextFactory.create(projectConnection)

	const projectConfigWithDb = {
		slug: 'test',
		db: projectDbCredentials,
		stages: [{ slug: 'live', name: 'live' }],
		systemSchema: 'system',
	}
	const systemMigrationsRunner = new SystemMigrationsRunner(
		databaseContextFactory,
		projectConfigWithDb,
		systemContainer.schemaVersionBuilder,
		test.migrationGroups ?? {},
		{
			resolveMetadata: () => Promise.resolve(emptyDatabaseMetadata),
		} as unknown as DatabaseMetadataResolver,
	)
	const stageCreator = new StageCreator()
	const projectInitializer = new ProjectInitializer(stageCreator, systemMigrationsRunner, db, projectConfigWithDb)

	await projectInitializer.initialize(createLogger(new NullLoggerHandler()))


	try {
		await stageCreator.createStage(db, { slug: 'live', name: 'live' })
		const stage = await db.queryHandler.fetch(new StageBySlugQuery('live'))
		if (!stage) {
			throw new Error()
		}
		const migration = {
			type: 'schema',
			version: '2019-01-01-100000',
			name: '2019-01-01-100000-init',
			formatVersion: VERSION_LATEST,
			modifications,
		} as const
		await systemContainer.projectMigrator.migrate({
			db,
			stages: [stage],
			migrationsToExecute: [migration],
			options: {},
			identity: { id: '00000000-0000-0000-0000-000000000000' },
			project: projectConfigWithDb,
		})
		const model = schema.model
		const permissions = new AllowAllPermissionFactory().create(model)
		const authorizator = new Authorizator(permissions, false)
		const gqlSchemaBuilderFactory = new GraphQlSchemaBuilderFactory()
		const gqlSchemaBuilder = gqlSchemaBuilderFactory.create(model, authorizator)
		const gqlSchema = gqlSchemaBuilder.build()

		const schemaName = stage.schema
		const projectDb = db.client.forSchema(schemaName)

		const providers = {
			uuid: uuidGenerator,
			now: () => new Date('2019-09-04 12:00'),
		}

		const databaseMetadataResolver = new DatabaseMetadataResolver()
		const metadata = await databaseMetadataResolver.resolveMetadata(db.client, schemaName)

		const queryContent = async (stageSlug: string, gql: string, variables?: { [key: string]: any }): Promise<any> => {
			const executionContainer = (test.executionContainerFactoryFactory?.(providers) ?? new ExecutionContainerFactory(providers))
				.create({
					schema: { ...schema, id: 1 },
					permissions,
					db: projectDb,
					identityId: '00000000-0000-0000-0000-000000000000',
					identityVariables: {},
					systemSchema: 'system',
					stage: stage,
					project: { slug: 'test' },
					schemaDatabaseMetadata: metadata,
				})
			const context: ContentContext = {
				db: projectDb,
				identityVariables: {},
				executionContainer,
				timer: (label, cb) => cb(),
			}
			const result = JSON.parse(JSON.stringify(await graphql({
				schema: gqlSchema,
				source: gql,
				contextValue: context,
				variableValues: variables,
			})))
			if (result.errors) {
				throw result.errors[0]
			}
			return result.data
		}


		const logger = createLogger(new NullLoggerHandler())
		await withLogger(logger, async () => {
			for (const { query, queryVariables } of test.seed) {
				await queryContent('prod', query, queryVariables)
			}

			try {
				const response = await queryContent('prod', test.query, test.queryVariables)
				if ('return' in test) {
					if (typeof test.return === 'function') {
						test.return(response)
					} else {
						assert.deepStrictEqual(response, test.return)
					}
				}
			} catch (e) {
				if ('throws' in test && e instanceof Error) {
					assert.equal(e.message, test.throws.message)
				} else {
					throw e
				}
			}
		})


		const checkDb = async (db: Client, expectation: DatabaseExpectation) => {
			const dbData: DatabaseExpectation = {}
			for (const table of Object.keys(expectation || {})) {
				const qb = SelectBuilder.create().from(table)

				const columns = Object.keys((expectation || {})[table][0] ?? {})
				const qbWithSelect = columns.length ? columns.reduce<SelectBuilder<Record<string, any>>>((qb, column) => qb.select(column), qb) : qb.select(it => it.raw('*'))
				dbData[table] = await qbWithSelect.getResult(db)
			}
			try {
				assert.deepStrictEqual(dbData, expectation ?? {})
			} catch (e) {
				// eslint-disable-next-line no-console
				console.log(JSON.stringify(dbData))
				throw e
			}
		}
		await checkDb(projectDb, test.expectDatabase ?? {})
		await checkDb(db.client, test.expectSystemDatabase ?? {})
	} finally {
		await projectConnection.end()
	}
}
