import Project from '../../src/config/Project'
import MigrationFilesManager from '../../src/migrations/MigrationFilesManager'
import MigrationsRunner from '../../src/core/migrations/MigrationsRunner'
import { setupSystemVariables, unnamedIdentity } from '../../src/system-api/SystemVariablesSetupHelper'
import CreateInitEventCommand from '../../src/system-api/model/commands/CreateInitEventCommand'
import SchemaVersionBuilder from '../../src/content-schema/SchemaVersionBuilder'
import GraphQlSchemaBuilderFactory from '../../src/content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import MigrationsResolver from '../../src/content-schema/MigrationsResolver'
import { createMock } from '../../src/utils/testing'
import S3 from '../../src/utils/S3'
import systemTypeDefs from '../../src/system-api/schema/system.graphql'
import { makeExecutableSchema } from 'graphql-tools'
import SystemContainerFactory from '../../src/system-api/SystemContainerFactory'
import 'mocha'
import PermissionsByIdentityFactory from '../../src/acl/PermissionsByIdentityFactory'
import { testUuid } from './testUuid'
import { maskErrors } from 'graphql-errors'
import SchemaMigrator from '../../src/content-schema/differ/SchemaMigrator'
import ModificationHandlerFactory from '../../src/system-api/model/migrations/modifications/ModificationHandlerFactory'
import ContentApiTester from './ContentApiTester'
import SystemApiTester from './SystemApiTester'
import TesterStageManager from './TesterStageManager'
import SequenceTester from './SequenceTester'
import SystemExecutionContainer from '../../src/system-api/SystemExecutionContainer'
import Connection from '../../src/core/database/Connection'
import { wrapIdentifier } from '../../src/core/database/utils'

export default class ApiTester {
	public static project: Project = {
		id: testUuid(1000),
		name: 'test',
		stages: [],
		slug: 'test',
		dbCredentials: {} as any,
		s3: {} as any,
	}

	constructor(
		public readonly content: ContentApiTester,
		public readonly system: SystemApiTester,
		public readonly stages: TesterStageManager,
		public readonly sequences: SequenceTester,
		public readonly systemExecutionContainer: ReturnType<
			ReturnType<SystemExecutionContainer.Factory['createBuilder']>['build']
		>
	) {}

	public static async create(
		options: {
			project?: Partial<Project>
			migrationsResolver?: MigrationsResolver
			systemExecutionContainerHook?: (
				container: ReturnType<SystemExecutionContainer.Factory['createBuilder']>
			) => ReturnType<SystemExecutionContainer.Factory['createBuilder']>
		} = {}
	): Promise<ApiTester> {
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
				{}
			)
		}

		const connection = createConnection(process.env.TEST_DB_MAINTENANCE_NAME || 'postgres')

		const dbName = String(process.env.TEST_DB_NAME)
		await connection.query('DROP DATABASE IF EXISTS ' + wrapIdentifier(dbName), [])
		await connection.query('CREATE DATABASE ' + wrapIdentifier(dbName), [])

		const migrationsRunner = new MigrationsRunner()
		const systemMigrationsManager = new MigrationFilesManager(
			process.cwd() + (process.env.TEST_CWD_SUFFIX || '') + '/migrations/project'
		)
		await migrationsRunner.migrate(dbCredentials(dbName), 'system', systemMigrationsManager.directory, false)
		await connection.end()

		const projectConnection = createConnection(dbName)
		const projectDb = projectConnection.createClient('system')

		await setupSystemVariables(projectDb, unnamedIdentity)

		await new CreateInitEventCommand().execute(projectDb)

		const projectMigrationFilesManager = ApiTester.createProjectMigrationFilesManager()
		const migrationsResolver = options.migrationsResolver || new MigrationsResolver(projectMigrationFilesManager)
		const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
		const schemaMigrator = new SchemaMigrator(modificationHandlerFactory)
		const schemaVersionBuilder = new SchemaVersionBuilder(
			projectDb.createQueryHandler(),
			migrationsResolver,
			schemaMigrator
		)
		const gqlSchemaBuilderFactory = new GraphQlSchemaBuilderFactory(
			createMock<S3>({
				formatPublicUrl() {
					throw new Error()
				},
				getSignedUrl() {
					throw new Error()
				},
			})
		)

		const systemContainerFactory = new SystemContainerFactory()
		const systemContainer = systemContainerFactory.create({
			project: { ...ApiTester.project, ...(options.project || {}) },
			migrationsResolver: migrationsResolver,
			migrationFilesManager: projectMigrationFilesManager,
			permissionsByIdentityFactory: new PermissionsByIdentityFactory([
				new PermissionsByIdentityFactory.SuperAdminPermissionFactory(),
				new PermissionsByIdentityFactory.RoleBasedPermissionFactory(),
			]),
			schemaMigrator,
			modificationHandlerFactory,
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
		})

		let closed = false
		afterEach(async () => {
			if (!closed) {
				await projectConnection.end()
				closed = true
			}
		})

		const stageManager = new TesterStageManager(
			options.project ? options.project.stages || [] : [],
			projectDb,
			systemExecutionContainer.stageCreator,
			systemExecutionContainer.projectMigrator,
			migrationsResolver
		)

		const contentApiTester = new ContentApiTester(
			projectDb,
			gqlSchemaBuilderFactory,
			stageManager,
			schemaVersionBuilder
		)
		const systemApiTester = new SystemApiTester(projectDb, systemSchema, systemContainer, systemExecutionContainer)
		const sequenceTester = new SequenceTester(projectDb.createQueryHandler(), contentApiTester, systemApiTester)

		return new ApiTester(contentApiTester, systemApiTester, stageManager, sequenceTester, systemExecutionContainer)
	}

	private static createProjectMigrationFilesManager(): MigrationFilesManager {
		return new MigrationFilesManager(
			process.cwd() + (process.env.TEST_CWD_SUFFIX || '') + '/tests/example-project/migrations'
		)
	}
}
