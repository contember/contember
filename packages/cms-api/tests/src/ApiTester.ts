import Project from '../../src/config/Project'
import KnexWrapper from '../../src/core/knex/KnexWrapper'
import MigrationFilesManager from '../../src/migrations/MigrationFilesManager'
import knex from 'knex'
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

export default class ApiTester {
	public static project: Project = {
		uuid: testUuid(1000),
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
		public readonly sequences: SequenceTester
	) {}

	public static async create(
		options: {
			project?: Partial<Project>
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

		const createConnection = (dbName: string): knex => {
			return knex({
				debug: false,
				client: 'pg',
				connection: dbCredentials(dbName),
			})
		}

		const connection = createConnection(process.env.TEST_DB_MAINTENANCE_NAME || 'postgres')

		const dbName = String(process.env.TEST_DB_NAME)
		await connection.raw('DROP DATABASE IF EXISTS ?? ', [dbName])
		await connection.raw('CREATE DATABASE ?? ', [dbName])

		const migrationsRunner = new MigrationsRunner()
		const systemMigrationsManager = new MigrationFilesManager(
			process.cwd() + (process.env.TEST_CWD_SUFFIX || '') + '/migrations/project'
		)
		await migrationsRunner.migrate(dbCredentials(dbName), 'system', systemMigrationsManager.directory, false)
		await connection.destroy()

		const projectDb = new KnexWrapper(createConnection(dbName), 'system')

		await setupSystemVariables(projectDb, unnamedIdentity)

		await new CreateInitEventCommand().execute(projectDb)

		const projectMigrationFilesManager = ApiTester.createProjectMigrationFilesManager()
		const migrationsResolver = new MigrationsResolver(projectMigrationFilesManager)
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
			systemKnexWrapper: projectDb,
		})

		const systemExecutionContainer = systemContainer.systemExecutionContainerFactory.create(projectDb)

		const systemSchema = makeExecutableSchema({
			typeDefs: systemTypeDefs,
			resolvers: systemContainer.get('systemResolvers') as any,
		})
		maskErrors(systemSchema, err => {
			console.error(err)
			process.exit(1)
		})

		afterEach(async () => {
			await projectDb.knex.destroy()
		})

		const stageManager = new TesterStageManager(projectDb, systemExecutionContainer.stageMigrator)
		const contentApiTester = new ContentApiTester(
			projectDb,
			gqlSchemaBuilderFactory,
			stageManager,
			schemaVersionBuilder
		)
		const systemApiTester = new SystemApiTester(projectDb, systemSchema, systemContainer, systemExecutionContainer)
		const sequenceTester = new SequenceTester(projectDb.createQueryHandler(), contentApiTester, systemApiTester)

		return new ApiTester(contentApiTester, systemApiTester, stageManager, sequenceTester)
	}

	private static createProjectMigrationFilesManager(): MigrationFilesManager {
		return new MigrationFilesManager(
			process.cwd() + (process.env.TEST_CWD_SUFFIX || '') + '/tests/example-project/migrations'
		)
	}
}
