import { Schema } from '@contember/schema'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '@contember/schema-migrations'
import { AllowAllPermissionFactory, emptySchema, Providers } from '@contember/schema-utils'
import { SelectBuilder } from '@contember/database'
import { assert } from 'vitest'
import {
	Authorizator,
	ExecutionContainerFactory,
	GraphQlSchemaBuilderFactory,
	Context as ContentContext,
} from '@contember/engine-content-api'
import { MigrationGroup } from '@contember/database-migrations'
import { createUuidGenerator } from './testUuid'
import {
	DatabaseContextFactory, formatSchemaName,
	ProjectInitializer,
	StageBySlugQuery,
	StageCreator,
	SystemContainerFactory,
	SystemMigrationsRunner,

} from '@contember/engine-system-api'
import { createConnection, dbCredentials, recreateDatabase } from './dbUtils'
import { createLogger, JsonStreamLoggerHandler } from '@contember/logger'
import { graphql } from 'graphql'

type Test = {
	schema: Partial<Schema>
	seed: {
		query: string
		queryVariables?: Record<string, any>
	}[]
	query: string
	queryVariables?: Record<string, any>
	expectDatabase?: Record<string, Record<string, any>[]>
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


	const uuidGenerator = createUuidGenerator('1111')
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

	const dbName = String(process.env.TEST_DB_NAME)

	const projectDbCredentials = dbCredentials(dbName)
	const connection = await recreateDatabase(projectDbCredentials)
	await connection.end()

	const projectConnection = createConnection(projectDbCredentials)
	const databaseContextFactory = new DatabaseContextFactory('system', projectConnection, providers)
	const db = databaseContextFactory.create()

	const projectConfigWithDb = {
		slug: 'test',
		db: projectDbCredentials,
		stages: [{ slug: 'live', name: 'live' }],
	}
	const systemMigrationsRunner = new SystemMigrationsRunner(databaseContextFactory, projectConfigWithDb, 'system', systemContainer.schemaVersionBuilder, test.migrationGroups ?? {})
	const stageCreator = new StageCreator()
	const projectInitializer = new ProjectInitializer(stageCreator, systemMigrationsRunner, databaseContextFactory, projectConfigWithDb)

	await projectInitializer.initialize(createLogger(new JsonStreamLoggerHandler(process.stderr)))


	try {
		await stageCreator.createStage(db, { slug: 'live', name: 'live' })
		const stage = await db.queryHandler.fetch(new StageBySlugQuery('live'))
		if (!stage) {
			throw new Error()
		}
		await systemContainer.projectMigrator.migrate(db, [stage], [{
			version: '2019-01-01-100000',
			name: '2019-01-01-100000-init',
			formatVersion: VERSION_LATEST,
			modifications,
		}], {})

		const model = schema.model
		const permissions = new AllowAllPermissionFactory().create(model)
		const authorizator = new Authorizator(permissions, false)
		const gqlSchemaBuilderFactory = new GraphQlSchemaBuilderFactory()
		const gqlSchemaBuilder = gqlSchemaBuilderFactory.create(model, authorizator)
		const gqlSchema = gqlSchemaBuilder.build()

		const projectDb = db.client.forSchema(formatSchemaName(stage))

		const providers = {
			uuid: uuidGenerator,
			now: () => new Date('2019-09-04 12:00'),
		}

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
				})
			const context: ContentContext = {
				db: projectDb,
				identityVariables: {},
				executionContainer,
				timer: async (label, cb) => (cb ? await cb() : (undefined as any)),
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

		const dbData: Record<string, Record<string, any>[]> = {}
		for (const table of Object.keys(test.expectDatabase || {})) {
			const qb = SelectBuilder.create().from(table)

			const columns = Object.keys((test.expectDatabase || {})[table][0] || { id: null })
			const qbWithSelect = columns.reduce<SelectBuilder<Record<string, any>>>((qb, column) => qb.select(column), qb)
			dbData[table] = await qbWithSelect.getResult(projectDb)
		}
		assert.deepStrictEqual(dbData, test.expectDatabase ?? {})
	} finally {
		await connection.end()
	}
}
