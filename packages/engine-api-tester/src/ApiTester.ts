import 'jasmine'
import {
	CreateInitEventCommand,
	DatabaseContextFactory,
	MigrationArgs,
	ProjectConfig,
	SystemContainer,
	SystemContainerFactory,
	systemMigrationsDirectory,
	typeDefs as systemTypeDefs,
	unnamedIdentity,
} from '@contember/engine-system-api'
import { MigrationFilesManager, MigrationsResolver, ModificationHandlerFactory } from '@contember/schema-migrations'
import {
	ContentApplyDependenciesFactoryImpl,
	ContentEventApplier,
	createMapperContainer,
	EntitiesSelector,
	EntitiesSelectorMapperFactory,
	GraphQlSchemaBuilderFactory,
	PermissionsByIdentityFactory,
} from '@contember/engine-content-api'
import { makeExecutableSchema } from 'graphql-tools'
import { ContentApiTester } from './ContentApiTester'
import { SystemApiTester } from './SystemApiTester'
import { TesterStageManager } from './TesterStageManager'
import { SequenceTester } from './SequenceTester'
import { Client, EventManagerImpl, SingleConnection } from '@contember/database'
import { createUuidGenerator } from './testUuid'
import { graphqlObjectFactories } from './graphqlObjectFactories'
import { project } from './project'
import { createConnection, dbCredentials, recreateDatabase } from './dbUtils'
import { join } from 'path'
import { createPgClient } from '@contember/database-migrations'

export class ApiTester {
	public static project = project

	constructor(
		public readonly client: Client,
		public readonly databaseContextFactory: DatabaseContextFactory,
		public readonly systemContainer: SystemContainer,
		public readonly content: ContentApiTester,
		public readonly system: SystemApiTester,
		public readonly stages: TesterStageManager,
		public readonly sequences: SequenceTester,
		public readonly cleanup: () => Promise<void>,
	) {}

	public static async create(options: {
		project?: Partial<ProjectConfig>
		migrationsResolver?: MigrationsResolver
		systemContainerHook?: (
			container: ReturnType<SystemContainerFactory['createBuilder']>,
		) => ReturnType<SystemContainerFactory['createBuilder']>
	}): Promise<ApiTester> {
		const dbName = String(process.env.TEST_DB_NAME)

		const projectConnection = createConnection(dbName)
		const providers = { uuid: createUuidGenerator('a452'), now: () => new Date('2019-09-04 12:00') }
		const databaseContextFactory = new DatabaseContextFactory(projectConnection.createClient('system'), providers)

		// await setupSystemVariables(projectDb, unnamedIdentity, { uuid: createUuidGenerator('a450') })

		const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
		const gqlSchemaBuilderFactory = new GraphQlSchemaBuilderFactory(graphqlObjectFactories)

		const systemContainerFactory = new SystemContainerFactory()
		const projectSlug = options.project?.slug || ApiTester.project.slug
		const migrationFilesManager = MigrationFilesManager.createForProject(ApiTester.getMigrationsDir(), projectSlug)
		const migrationsResolver = options.migrationsResolver || new MigrationsResolver(migrationFilesManager)
		const permissionsByIdentityFactory = new PermissionsByIdentityFactory()
		const mapperFactory: EntitiesSelectorMapperFactory = (db, schema, identityVariables, permissions) =>
			createMapperContainer({ schema, identityVariables, permissions, providers }).mapperFactory(db)
		let systemContainerBuilder = systemContainerFactory.createBuilder({
			migrationsResolverFactory: project => migrationsResolver,
			entitiesSelector: new EntitiesSelector(mapperFactory, permissionsByIdentityFactory),
			modificationHandlerFactory,
			providers: providers,
			eventApplier: new ContentEventApplier(new ContentApplyDependenciesFactoryImpl()),
			identityFetcher: {
				fetchIdentities: (ids: string[]) => {
					return Promise.resolve([])
				},
			},
		})
		if (options.systemContainerHook) {
			systemContainerBuilder = options.systemContainerHook(systemContainerBuilder)
		}
		const systemContainer = systemContainerBuilder.build()

		const connection = await recreateDatabase(dbName)
		await connection.end()

		const projectConfig = { ...ApiTester.project, ...options.project }

		const db = databaseContextFactory.create(unnamedIdentity)

		const pgClient = createPgClient(dbCredentials(dbName))
		await pgClient.connect()
		const singleConnection = new SingleConnection(pgClient, {}, new EventManagerImpl(), true)
		const dbContextMigrations = databaseContextFactory
			.withClient(singleConnection.createClient('system'))
			.create(unnamedIdentity)

		const schemaResolver = () => systemContainer.schemaVersionBuilder.buildSchema(dbContextMigrations)
		await systemContainer
			.systemDbMigrationsRunnerFactory(dbCredentials(dbName), pgClient)
			.migrate<MigrationArgs>(true, {
				schemaResolver,
				project: projectConfig,
			})
		await pgClient.end()

		await db.commandBus.execute(new CreateInitEventCommand())

		const systemSchema = makeExecutableSchema({
			typeDefs: systemTypeDefs,
			resolvers: systemContainer.get('systemResolvers') as any,
			logger: {
				log: err => {
					console.error(err)
					process.exit(1)
					return err
				},
			},
		})

		const stageManager = new TesterStageManager(
			projectConfig,
			db,
			systemContainer.stageCreator,
			systemContainer.projectMigrator,
			migrationsResolver,
		)

		const contentApiTester = new ContentApiTester(
			db,
			gqlSchemaBuilderFactory,
			stageManager,
			systemContainer.schemaVersionBuilder,
		)
		const systemApiTester = new SystemApiTester(
			db,
			projectConfig,
			systemContainer.eventApplier,
			systemSchema,
			systemContainer,
		)
		const sequenceTester = new SequenceTester(db.client.createQueryHandler(), contentApiTester, systemApiTester)

		let closed = false

		return new ApiTester(
			db.client,
			databaseContextFactory,
			systemContainer,
			contentApiTester,
			systemApiTester,
			stageManager,
			sequenceTester,
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
