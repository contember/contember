import {
	DatabaseContextFactory,
	ProjectConfig, ProjectInitializer, StageCreator,
	SystemContainer,
	SystemContainerFactory, SystemMigrationsRunner,
	typeDefs as systemTypeDefs,
} from '@contember/engine-system-api'
import { MigrationFilesManager, MigrationsResolver, ModificationHandlerFactory } from '@contember/schema-migrations'
import { GraphQlSchemaBuilderFactory } from '@contember/engine-content-api'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { ContentApiTester } from './ContentApiTester'
import { SystemApiTester } from './SystemApiTester'
import { TesterStageManager } from './TesterStageManager'
import { Client } from '@contember/database'
import { createUuidGenerator } from './testUuid'
import { project } from './project'
import { createConnection, dbCredentials, recreateDatabase } from './dbUtils'
import { join } from 'path'
import { createLogger, JsonStreamLoggerHandler, NullLoggerHandler } from '@contember/logger'
import { Providers } from '@contember/schema-utils'

export class ApiTester {
	public static project = project

	constructor(
		public readonly client: Client,
		public readonly databaseContextFactory: DatabaseContextFactory,
		public readonly systemContainer: SystemContainer,
		public readonly content: ContentApiTester,
		public readonly system: SystemApiTester,
		public readonly stages: TesterStageManager,
		public readonly cleanup: () => Promise<void>,
	) {
	}

	public static async create(options: {
		project?: Partial<ProjectConfig>
		migrationsResolver?: MigrationsResolver
		systemContainerHook?: (
			container: ReturnType<SystemContainerFactory['createBuilder']>,
		) => ReturnType<SystemContainerFactory['createBuilder']>
		mapperContainerFactoryFactory?: (providers: Providers) => MapperContainerFactory
	}): Promise<ApiTester> {
		const dbName = String(process.env.TEST_DB_NAME)

		const projectDbCredentials = dbCredentials(dbName)
		const projectConnection = createConnection(projectDbCredentials)
		const providers = { uuid: createUuidGenerator('a452'), now: () => new Date('2019-09-04 12:00') }
		const databaseContextFactory = new DatabaseContextFactory(projectConnection.createClient('system', {}), providers)

		// await setupSystemVariables(projectDb, unnamedIdentity, { uuid: createUuidGenerator('a450') })

		const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
		const gqlSchemaBuilderFactory = new GraphQlSchemaBuilderFactory()

		const systemContainerFactory = new SystemContainerFactory(providers, modificationHandlerFactory)
		const projectSlug = options.project?.slug || ApiTester.project.slug
		const migrationFilesManager = MigrationFilesManager.createForProject(ApiTester.getMigrationsDir(), projectSlug)
		const migrationsResolver = options.migrationsResolver || new MigrationsResolver(migrationFilesManager)
		let systemContainerBuilder = systemContainerFactory.createBuilder({
			identityFetcher: {
				fetchIdentities: () => {
					return Promise.resolve([])
				},
			},
		})
		if (options.systemContainerHook) {
			systemContainerBuilder = options.systemContainerHook(systemContainerBuilder)
		}
		const systemContainer = systemContainerBuilder.build()

		const connection = await recreateDatabase(projectDbCredentials)
		await connection.end()

		const projectConfig = { ...ApiTester.project, ...options.project }

		const db = databaseContextFactory.create()

		const stageCreator = new StageCreator()
		const projectConfigWithDb = {
			...projectConfig,
			db: projectDbCredentials,
		}
		const systemMigrationsRunner = new SystemMigrationsRunner(databaseContextFactory, projectConfigWithDb, 'system', systemContainer.schemaVersionBuilder)
		const projectInitializer = new ProjectInitializer(stageCreator, systemMigrationsRunner, databaseContextFactory, projectConfigWithDb)

		await projectInitializer.initialize(createLogger(new JsonStreamLoggerHandler(process.stderr)))

		const systemSchema = makeExecutableSchema({
			typeDefs: systemTypeDefs,
			resolvers: systemContainer.get('systemResolversFactory').create(false) as any,
		})

		const stageManager = new TesterStageManager(
			projectConfig,
			db,
			stageCreator,
			systemContainer.projectMigrator,
			migrationsResolver,
		)

		const contentApiTester = new ContentApiTester(
			db,
			gqlSchemaBuilderFactory,
			stageManager,
			systemContainer.schemaVersionBuilder,
		)
		const systemApiTester = new SystemApiTester(db, projectConfig, systemSchema, systemContainer)
		let closed = false

		return new ApiTester(
			db.client,
			databaseContextFactory,
			systemContainer,
			contentApiTester,
			systemApiTester,
			stageManager,
			async () => {
				if (!closed) {
					await projectConnection.end()
					closed = true
				}
			},
		)
	}

	public static getMigrationsDir(): string {
		return join(__dirname + '/../../src')
	}
}
