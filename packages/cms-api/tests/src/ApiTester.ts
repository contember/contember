import Project from '../../src/config/Project'
import KnexWrapper from '../../src/core/knex/KnexWrapper'
import CreateOrUpdateStageCommand from '../../src/system-api/model/commands/CreateOrUpdateStageCommand'
import MigrationFilesManager from '../../src/migrations/MigrationFilesManager'
import knex from 'knex'
import MigrationsRunner from '../../src/core/migrations/MigrationsRunner'
import { setupSystemVariables } from '../../src/system-api/SystemVariablesSetupHelper'
import CreateInitEventCommand from '../../src/system-api/model/commands/CreateInitEventCommand'
import { graphql, GraphQLSchema } from 'graphql'
import SchemaVersionBuilder from '../../src/content-schema/SchemaVersionBuilder'
import GraphQlSchemaBuilderFactory from '../../src/content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import AllowAllPermissionFactory from '../../src/acl/AllowAllPermissionFactory'
import { Context as ContentContext } from '../../src/content-api/types'
import { formatSchemaName } from '../../src/system-api/model/helpers/stageHelpers'
import MigrationsResolver from '../../src/content-schema/MigrationsResolver'
import { createMock } from '../../src/utils/testing'
import S3 from '../../src/utils/S3'
import systemTypeDefs from '../../src/system-api/schema/system.graphql'
import { makeExecutableSchema } from 'graphql-tools'
import SystemContainerFactory, { SystemContainer } from '../../src/system-api/SystemContainerFactory'
import ResolverContext from '../../src/system-api/resolvers/ResolverContext'
import 'mocha'
import PermissionsByIdentityFactory from '../../src/acl/PermissionsByIdentityFactory'
import { testUuid } from './testUuid'
import Identity from '../../src/common/auth/Identity'
import { maskErrors } from 'graphql-errors'
import ExecutionContainerFactory from '../../src/content-api/graphQlResolver/ExecutionContainerFactory'
import LatestMigrationByStageQuery from '../../src/system-api/model/queries/LatestMigrationByStageQuery'
import SystemExecutionContainer from '../../src/system-api/SystemExecutionContainer'
import { Schema } from 'cms-common'
import { GQL } from './tags'
import SchemaMigrator from '../../src/content-schema/differ/SchemaMigrator'
import ModificationHandlerFactory from '../../src/system-api/model/migrations/modifications/ModificationHandlerFactory'
import FileNameHelper from '../../src/migrations/FileNameHelper'
import EventSequence from './EventSequence'
import { DiffResult } from '../../src/system-api/schema/types'
import { AnyEvent, CreateEvent } from '../../src/system-api/model/dtos/Event'
import InitEventQuery from '../../src/system-api/model/queries/InitEventQuery'
import StageBySlugQuery from '../../src/system-api/model/queries/StageBySlugQuery'
import DiffQuery from '../../src/system-api/model/queries/DiffQuery'
import { expect } from 'chai'
import { EventType } from '../../src/system-api/model/EventType'

export class ApiTester {
	public static project: Project = {
		uuid: testUuid(1000),
		name: 'test',
		stages: [],
		slug: 'test',
		dbCredentials: {} as any,
		s3: {} as any,
	}

	private knownStages: { [stageSlug: string]: Project.Stage & { migration?: string } } = {}

	constructor(
		private readonly projectDb: KnexWrapper,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly graphQlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly systemSchema: GraphQLSchema,
		private readonly systemContainer: SystemContainer,
		private readonly systemExecutionContainer: SystemExecutionContainer
	) {}

	public async createStage(stage: Project.Stage): Promise<void> {
		await new CreateOrUpdateStageCommand({
			id: stage.uuid,
			...stage,
		}).execute(this.projectDb)
		this.knownStages[stage.slug] = stage
	}

	public async migrateStage(slug: string, version: string): Promise<void> {
		version = FileNameHelper.extractVersion(version)
		const stageMigrator = this.systemExecutionContainer.stageMigrator
		const stage = this.getStage(slug)
		await stageMigrator.migrate({ ...stage }, () => null, version)
		this.knownStages[slug] = { ...stage, migration: version }
	}

	private getStage(slug: string): Project.Stage & { migration?: string } {
		const stage = this.knownStages[slug]
		if (!stage) {
			throw new Error(`Unknown stage ${stage}`)
		}
		return stage
	}

	public async getStageSchema(stageSlug: string): Promise<Schema> {
		const stage = this.getStage(stageSlug)
		if (!stage.migration) {
			throw new Error(`Unknown migration version for stage ${stageSlug}`)
		}
		return await this.schemaVersionBuilder.buildSchema(stage.migration)
	}

	public async queryContent(stageSlug: string, gql: string, variables?: { [key: string]: any }): Promise<any> {
		await setupSystemVariables(this.projectDb, '11111111-1111-1111-1111-111111111111')
		const stage = this.getStage(stageSlug)
		const model = (await this.getStageSchema(stageSlug)).model
		const permissions = new AllowAllPermissionFactory().create(model)
		const gqlSchemaBuilder = this.graphQlSchemaBuilderFactory.create(model, permissions)
		const schema = gqlSchemaBuilder.build()
		const db = this.projectDb.forSchema(formatSchemaName(stage))

		const executionContainer = new ExecutionContainerFactory(model, permissions).create({
			db,
			identityVariables: {},
		})
		const context: ContentContext = {
			db,
			identityVariables: {},
			executionContainer,
			errorHandler: () => null,
			timer: async (label, cb) => (cb ? await cb() : (undefined as any)),
		}
		maskErrors(schema, err => {
			console.error(err)
			process.exit(1)
		})
		const result = await graphql(schema, gql, null, context, variables)
		if (result.errors) {
			result.errors.map(it => console.error(it))
		}
		return result
	}

	public async querySystem(
		gql: string,
		variables?: { [key: string]: any },
		options: {
			identity?: Identity
			roles?: string[]
			projectRoles?: string[]
		} = {}
	): Promise<any> {
		await setupSystemVariables(this.projectDb, '11111111-1111-1111-1111-111111111111')
		const context: ResolverContext = new ResolverContext(
			options.identity ||
				new Identity.StaticIdentity(testUuid(888), options.roles || [Identity.SystemRole.SUPER_ADMIN], {
					[ApiTester.project.uuid]: options.projectRoles || [],
				}),
			{},
			this.systemContainer.authorizator,
			this.systemExecutionContainer,
			() => null
		)

		return await graphql(this.systemSchema, gql, null, context, variables)
	}

	public async diff(baseStage: string, headStage: string): Promise<DiffResult> {
		const result = await this.querySystem(
			GQL`query($baseStage: String!, $headStage: String!) {
      diff(baseStage: $baseStage, headStage: $headStage) {
	      ok
        errors
        result {
          events {
            id
            dependencies
            description
            allowed
            type
          }
        }
      }
    }`,
			{ baseStage, headStage }
		)

		if (!result.data.diff.ok) {
			throw result.data.diff.errors
		}

		return result.data.diff.result
	}

	public async refreshStagesVersion() {
		const queryHandler = this.projectDb.createQueryHandler()
		for (let stage in this.knownStages) {
			const stageObj = this.knownStages[stage]
			const latestMigration = await queryHandler.fetch(new LatestMigrationByStageQuery(stageObj.uuid))
			this.knownStages[stage] = {
				...stageObj,
				migration: latestMigration ? latestMigration.data.version : undefined,
			}
		}
	}

	public async releaseForward(baseStage: string, headStage: string, eventsCount?: number): Promise<void> {
		const diff = await this.querySystem(
			GQL`query($headStage: String!, $baseStage: String!) {
      diff(baseStage: $baseStage, headStage: $headStage) {
	      ok
	      errors
        result {
          events {
            id
          }
        }
      }
    }`,
			{
				headStage,
				baseStage,
			}
		)
		if (!diff.data.diff.ok) {
			throw diff.data.diff.errors
		}

		await this.querySystem(
			GQL`mutation ($baseStage: String!, $headStage: String!, $events: [String!]!) {
        release(baseStage: $baseStage, headStage: $headStage, events: $events) {
          ok
        }
      }`,
			{
				baseStage,
				headStage,
				events: (diff.data.diff.result.events as any[])
					.slice(0, eventsCount || diff.data.diff.result.events.length)
					.map(it => it.id),
			}
		)
	}

	public async runSequence(sequences: EventSequence.StringSequenceSet): Promise<void> {
		const sequenceSet = EventSequence.parseSet(sequences)

		const executed = new Set<string>()
		for (const sequence of sequenceSet) {
			if (sequence.baseStage && !executed.has(sequence.baseStage)) {
				throw new Error('Sequences has to be sorted')
			}
			await this.executeSingleSequence(sequence)
			executed.add(sequence.stage)
		}
	}

	private async executeSingleSequence(sequence: EventSequence): Promise<void> {
		for (const event of sequence.sequence) {
			switch (event.type) {
				case 'event':
					await this.queryContent(
						sequence.stage,
						GQL`mutation ($number: Int!) {
            createEntry(data: {number: $number}) {
              id
            }
          }`,
						{ number: event.number }
					)
					break
				case 'follow':
					await this.releaseForward(sequence.stage, sequence.baseStage!, 1)
					break
			}
		}
	}

	public async fetchEvents(stage: string): Promise<AnyEvent[]> {
		const queryHandler = this.systemExecutionContainer.queryHandler
		const initEvent = await queryHandler.fetch(new InitEventQuery())
		const stageHead = (await queryHandler.fetch(new StageBySlugQuery(stage)))!.event_id

		return await queryHandler.fetch(new DiffQuery(initEvent.id, stageHead))
	}

	public async verifySequence(sequences: EventSequence.StringSequenceSet, skip: number = 0): Promise<void> {
		const sequenceSet = EventSequence.parseSet(sequences)

		const events: Record<string, AnyEvent[]> = {}
		for (const sequence of sequenceSet) {
			events[sequence.stage] = (await this.fetchEvents(sequence.stage)).slice(skip)
		}

		for (const sequence of sequenceSet) {
			for (const i in sequence.sequence) {
				const sequenceItem = sequence.sequence[i]

				const event = events[sequence.stage][i]
				expect(event).not.undefined

				switch (sequenceItem.type) {
					case 'event':
						expect(event.type).eq(EventType.create)
						expect((event as CreateEvent).values).deep.eq({ number: sequenceItem.number })
						break
					case 'follow':
						const baseEvent = events[sequence.baseStage!][i]
						expect(baseEvent).not.undefined

						expect(event.id).eq(baseEvent.id)
						break
				}
			}
		}
	}

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

		await setupSystemVariables(projectDb, '11111111-1111-1111-1111-111111111111')

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

		return new ApiTester(
			projectDb,
			schemaVersionBuilder,
			gqlSchemaBuilderFactory,
			systemSchema,
			systemContainer,
			systemExecutionContainer
		)
	}

	private static createProjectMigrationFilesManager(): MigrationFilesManager {
		return new MigrationFilesManager(
			process.cwd() + (process.env.TEST_CWD_SUFFIX || '') + '/tests/example-project/migrations'
		)
	}
}
