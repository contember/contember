import 'jasmine'
import {
	CreateInitEventCommand,
	DatabaseContextFactory,
	ProjectConfig,
	SystemContainer,
	SystemContainerFactory,
	systemMigrationsDirectory,
	typeDefs as systemTypeDefs,
	unnamedIdentity,
} from '@contember/engine-system-api'
import { MigrationFilesManager, MigrationsResolver, ModificationHandlerFactory } from '@contember/schema-migrations'
import {
	GraphQlSchemaBuilderFactory,
	PermissionsByIdentityFactory,
	PermissionsVerifier,
} from '@contember/engine-content-api'
import { makeExecutableSchema } from 'graphql-tools'
import { ContentApiTester } from './ContentApiTester'
import { SystemApiTester } from './SystemApiTester'
import { TesterStageManager } from './TesterStageManager'
import { SequenceTester } from './SequenceTester'
import { Client } from '@contember/database'
import { createUuidGenerator } from './testUuid'
import { graphqlObjectFactories } from './graphqlObjectFactories'
import { project } from './project'
import { migrate } from './migrationsRunner'
import { createConnection, dbCredentials, recreateDatabase } from './dbUtils'
import { join } from 'path'

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
		const connection = await recreateDatabase(dbName)

		await migrate({ db: dbCredentials(dbName), schema: 'system', dir: systemMigrationsDirectory })
		await connection.end()

		const projectConnection = createConnection(dbName)
		const providers = { uuid: createUuidGenerator('a452') }
		const databaseContextFactory = new DatabaseContextFactory(projectConnection.createClient('system'), providers)

		// await setupSystemVariables(projectDb, unnamedIdentity, { uuid: createUuidGenerator('a450') })

		const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
		const gqlSchemaBuilderFactory = new GraphQlSchemaBuilderFactory(graphqlObjectFactories)

		const systemContainerFactory = new SystemContainerFactory()
		let systemContainerBuilder = systemContainerFactory.createBuilder({
			projectsDir: ApiTester.getMigrationsDir(),
			contentPermissionsVerifier: new PermissionsVerifier(new PermissionsByIdentityFactory()),
			modificationHandlerFactory,
			providers: providers,
		})
		if (options.systemContainerHook) {
			systemContainerBuilder = options.systemContainerHook(systemContainerBuilder)
		}
		const systemContainer = systemContainerBuilder.build()
		const db = databaseContextFactory.create(unnamedIdentity)

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
		const projectSlug = options.project?.slug || ApiTester.project.slug
		const migrationFilesManager = MigrationFilesManager.createForProject(ApiTester.getMigrationsDir(), projectSlug)
		const migrationsResolver = new MigrationsResolver(migrationFilesManager)

		const projectConfig = { ...options.project, ...ApiTester.project }
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
			systemContainer.releaseExecutor,
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
