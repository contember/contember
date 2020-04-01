import 'jasmine'
import {
	CreateInitEventCommand,
	ProjectConfig,
	SystemContainer,
	SystemContainerFactory,
	systemMigrationsDirectory,
	typeDefs as systemTypeDefs,
	unnamedIdentity,
} from '@contember/engine-system-api'
import { MigrationsResolver, ModificationHandlerFactory } from '@contember/schema-migrations'
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

		// await setupSystemVariables(projectDb, unnamedIdentity, { uuid: createUuidGenerator('a450') })

		const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
		const gqlSchemaBuilderFactory = new GraphQlSchemaBuilderFactory(graphqlObjectFactories)

		const systemContainerFactory = new SystemContainerFactory()
		let systemContainerBuilder = systemContainerFactory.createBuilder({
			connection: projectConnection,
			projectsDir: ApiTester.getMigrationsDir(),
			project: { ...ApiTester.project, ...(options.project || {}) },
			contentPermissionsVerifier: new PermissionsVerifier(new PermissionsByIdentityFactory()),
			modificationHandlerFactory,
			providers: { uuid: createUuidGenerator('a452') },
		})
		if (options.systemContainerHook) {
			systemContainerBuilder = options.systemContainerHook(systemContainerBuilder)
		}
		if (options.migrationsResolver) {
			systemContainerBuilder = systemContainerBuilder.replaceService(
				'migrationsResolver',
				() => options.migrationsResolver!,
			)
		}
		const systemContainer = systemContainerBuilder.build()
		const db = systemContainer.systemDatabaseContextFactory.create(unnamedIdentity)

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
			options.project ? options.project.stages || [] : [],
			db,
			systemContainer.stageCreator,
			systemContainer.projectMigrator,
			systemContainer.migrationsResolver,
		)

		const contentApiTester = new ContentApiTester(
			db,
			gqlSchemaBuilderFactory,
			stageManager,
			systemContainer.schemaVersionBuilder,
		)
		const systemApiTester = new SystemApiTester(db, systemContainer.releaseExecutor, systemSchema, systemContainer)
		const sequenceTester = new SequenceTester(db.client.createQueryHandler(), contentApiTester, systemApiTester)

		let closed = false

		return new ApiTester(
			db.client,
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
		return join(__dirname + '/../../src/example-project/migrations')
	}
}
