import 'jasmine'
import { MigrationFilesManager, MigrationsRunner } from '@contember/engine-common'
import {
	CreateInitEventCommand,
	createMigrationFilesManager,
	ProjectConfig,
	setupSystemVariables,
	SystemContainerFactory,
	SystemExecutionContainer,
	typeDefs as systemTypeDefs,
	unnamedIdentity,
} from '@contember/engine-system-api'
import {
	SchemaMigrator,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaVersionBuilder,
} from '@contember/schema-migrations'
import {
	GraphQlSchemaBuilderFactory,
	PermissionsByIdentityFactory,
	PermissionsVerifier,
} from '@contember/engine-content-api'
import { makeExecutableSchema } from 'graphql-tools'
import { maskErrors } from 'graphql-errors'
import { ContentApiTester } from './ContentApiTester'
import { SystemApiTester } from './SystemApiTester'
import { TesterStageManager } from './TesterStageManager'
import { SequenceTester } from './SequenceTester'
import { Client, Connection, wrapIdentifier } from '@contember/database'
import { createUuidGenerator } from './testUuid'
import { graphqlObjectFactories } from './graphqlObjectFactories'
import { getArgumentValues } from 'graphql/execution/values'
import { project } from './project'

export class ApiTester {
	public static project = project

	constructor(
		public readonly client: Client,
		public readonly content: ContentApiTester,
		public readonly system: SystemApiTester,
		public readonly stages: TesterStageManager,
		public readonly sequences: SequenceTester,
		public readonly systemExecutionContainer: ReturnType<
			ReturnType<SystemExecutionContainer.Factory['createBuilder']>['build']
		>,
		public readonly cleanup: () => Promise<void>,
	) {}

	public static async create(options: {
		project?: Partial<ProjectConfig>
		migrationsResolver?: MigrationsResolver
		systemExecutionContainerHook?: (
			container: ReturnType<SystemExecutionContainer.Factory['createBuilder']>,
		) => ReturnType<SystemExecutionContainer.Factory['createBuilder']>
	}): Promise<ApiTester> {
		const dbCredentials = (dbName: string) => {
			return {
				host: String(process.env.TEST_DB_HOST),
				port: Number(process.env.TEST_DB_PORT),
				user: String(process.env.TEST_DB_USER),
				password: String(process.env.TEST_DB_PASSWORD),
				database: dbName,
			}
		}

		const createConnection = (dbName: string): Connection => {
			return new Connection(
				{
					...dbCredentials(dbName),
					max: 1,
					min: 1,
				},
				{},
			)
		}

		const connection = createConnection(process.env.TEST_DB_MAINTENANCE_NAME || 'postgres')

		const dbName = String(process.env.TEST_DB_NAME)
		await connection.query('DROP DATABASE IF EXISTS ' + wrapIdentifier(dbName), [])
		await connection.query('CREATE DATABASE ' + wrapIdentifier(dbName), [])

		const systemMigrationsManager = createMigrationFilesManager()
		const migrationsRunner = new MigrationsRunner(dbCredentials(dbName), 'system', systemMigrationsManager.directory)
		await migrationsRunner.migrate(false)
		await connection.end()

		const projectConnection = createConnection(dbName)
		const projectDb = projectConnection.createClient('system')

		await setupSystemVariables(projectDb, unnamedIdentity, { uuid: createUuidGenerator('a450') })

		await new CreateInitEventCommand({ uuid: createUuidGenerator('a451') }).execute(projectDb)

		const projectMigrationFilesManager = ApiTester.createProjectMigrationFilesManager()
		const migrationsResolver = options.migrationsResolver || new MigrationsResolver(projectMigrationFilesManager)
		const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
		const schemaMigrator = new SchemaMigrator(modificationHandlerFactory)
		const schemaVersionBuilder = new SchemaVersionBuilder(migrationsResolver, schemaMigrator)
		const gqlSchemaBuilderFactory = new GraphQlSchemaBuilderFactory(graphqlObjectFactories, getArgumentValues)

		const systemContainerFactory = new SystemContainerFactory()
		const systemContainer = systemContainerFactory.create({
			project: { ...ApiTester.project, ...(options.project || {}) },
			migrationsResolver: migrationsResolver,
			migrationFilesManager: projectMigrationFilesManager,
			contentPermissionsVerifier: new PermissionsVerifier(
				new PermissionsByIdentityFactory([
					new PermissionsByIdentityFactory.SuperAdminPermissionFactory(),
					new PermissionsByIdentityFactory.RoleBasedPermissionFactory(),
				]),
			),
			schemaMigrator,
			modificationHandlerFactory,
			providers: { uuid: createUuidGenerator('a452') },
		})

		let systemExecutionContainerBuilder = systemContainer.systemExecutionContainerFactory.createBuilder(projectDb)
		if (options.systemExecutionContainerHook) {
			systemExecutionContainerBuilder = options.systemExecutionContainerHook(systemExecutionContainerBuilder)
		}
		const systemExecutionContainer = systemExecutionContainerBuilder.build()

		const systemSchema = makeExecutableSchema({
			typeDefs: systemTypeDefs,
			resolvers: systemContainer.get('systemResolvers') as any,
		})
		maskErrors(systemSchema, err => {
			console.error(err)
			process.exit(1)
			return err
		})

		const stageManager = new TesterStageManager(
			options.project ? options.project.stages || [] : [],
			projectDb,
			systemExecutionContainer.stageCreator,
			systemExecutionContainer.projectMigrator,
			migrationsResolver,
		)

		const contentApiTester = new ContentApiTester(
			projectDb,
			gqlSchemaBuilderFactory,
			stageManager,
			schemaVersionBuilder,
		)
		const systemApiTester = new SystemApiTester(projectDb, systemSchema, systemContainer, systemExecutionContainer)
		const sequenceTester = new SequenceTester(projectDb.createQueryHandler(), contentApiTester, systemApiTester)

		let closed = false

		return new ApiTester(
			projectDb,
			contentApiTester,
			systemApiTester,
			stageManager,
			sequenceTester,
			systemExecutionContainer,
			async () => {
				if (!closed) {
					await projectConnection.end()
					closed = true
				}
			},
		)
	}

	private static createProjectMigrationFilesManager(): MigrationFilesManager {
		return new MigrationFilesManager(__dirname + '/../../src/example-project/migrations')
	}
}
