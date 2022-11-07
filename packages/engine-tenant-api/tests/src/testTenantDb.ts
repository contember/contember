import { GraphQLTestQuery } from '../cases/integration/mocked/gql/types'
import { testUuid } from './testUuid'
import {
	CreateProjectCommand,
	createResolverContext,
	PermissionContext,
	ProjectSchemaResolver,
	StaticIdentity,
	TenantContainerFactory,
	TenantMigrationsRunner,
	TenantResolverContext,
	typeDefs,
} from '../../src'
import { Buffer } from 'buffer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { Acl, Schema } from '@contember/schema'
import { createMockedMailer, MockedMailer } from './mailer'
import { dbCredentials, recreateDatabase } from './dbUtils'
import { graphql } from 'graphql'
import { Connection } from '@contember/database'
import { assert } from 'vitest'
import { createLogger, JsonStreamLoggerHandler } from '@contember/logger'
import { emptySchema } from '@contember/schema-utils'

export interface TenantTest {
	query: GraphQLTestQuery
	return: object
	sentMails?: { subject: string }[]
}

export const createUuidGenerator = () => {
	let id = 1
	return () => testUuid(id++)
}

export const now = new Date('2019-09-04 12:00')
const schema: Schema = {
	...emptySchema,
	acl: {
		roles: {
			superEditor: {
				stages: '*',
				entities: {},
				tenant: {
					invite: true,
					manage: {
						editor: {
							variables: {
								language: 'language',
							},
						},
					},
				},
				variables: {
					language: {
						type: Acl.VariableType.entity,
						entityName: 'Language',
					},
				},
			},
			editor: {
				stages: '*',
				entities: {},
				variables: {
					language: {
						type: Acl.VariableType.entity,
						entityName: 'Language',
					},
				},
			},
		},
	},
}

const projectSchemaResolver: ProjectSchemaResolver = {
	getSchema: project => Promise.resolve(schema),
}

export const authenticatedIdentityId = testUuid(999)
export const authenticatedApiKeyId = testUuid(998)

interface TenantTestOptions {
	membership?: Acl.Membership
	roles?: string[]
	noErrorsCheck?: boolean
}

export interface TenantTester {
	execute(query: GraphQLTestQuery, options?: TenantTestOptions): Promise<any>
	mailer: MockedMailer
	end: () => Promise<void>
}

export const createTenantTester = async (): Promise<TenantTester> => {
	const dbName = String(process.env.TEST_DB_NAME)
	const credentials = dbCredentials(dbName)
	const conn = await recreateDatabase(dbName)
	await conn.end()
	const providers = {
		bcrypt: (value: string) => Promise.resolve('BCRYPTED-' + value),
		bcryptCompare: (data: string, hash: string) => Promise.resolve('BCRYPTED-' + data === hash),
		now: () => now,
		randomBytes: (length: number) => Promise.resolve(Buffer.alloc(length, (counter++).toString())),
		uuid: createUuidGenerator(),
		decrypt: () => {
			throw new Error('not supported')
		},
		encrypt: () => {
			throw new Error('not supported')
		},
		hash: (value: any) => Buffer.from(value.toString()),
	}
	const logger = createLogger(new JsonStreamLoggerHandler(process.stderr))
	const migrationsRunner = new TenantMigrationsRunner(credentials, 'tenant', {
		rootToken: process.env.CONTEMBER_ROOT_TOKEN,
	}, providers)
	let counter = 0
	await migrationsRunner.run(logger)
	const mailer = createMockedMailer()
	const projectInitializer = {
		initializeProject: () => Promise.resolve(),
	}
	const connection = Connection.create(credentials, err => logger.error(err))
	const tenantContainer = new TenantContainerFactory(providers)
		.createBuilder({
			mailOptions: {},
			dbCredentials: credentials,
			tenantCredentials: {},
			projectSchemaResolver,
			projectInitializer,
			connection,
			cryptoProviders: providers,
		})
		.replaceService('mailer', () => mailer)
		.build()

	const dbContext = tenantContainer.databaseContext

	await dbContext.commandBus.execute(new CreateProjectCommand({
		slug: 'blog',
		name: 'blog',
		config: {},
	}, now))

	const schema = makeExecutableSchema({
		typeDefs: typeDefs,
		resolvers: tenantContainer.resolvers as any,
		resolverValidationOptions: {
			requireResolversForResolveType: 'ignore',
		},
	})

	return {
		async execute(query: GraphQLTestQuery, options: TenantTestOptions = {}): Promise<any> {

			const context: TenantResolverContext = {
				...createResolverContext(
					new PermissionContext(
						new StaticIdentity(authenticatedIdentityId, options.roles || [], {
							blog: [options.membership || { role: 'admin', variables: [] }],
						}),
						tenantContainer.authorizator,
						tenantContainer.projectScopeFactory,
						projectSchemaResolver,
					),
					authenticatedApiKeyId,
				),
				logger: logger,
				db: dbContext,
			}
			const result = await graphql({
				schema,
				source: typeof query === 'string' ? query : query.query,
				contextValue: context,
				variableValues: typeof query === 'string' ? undefined : query.variables,
			})
			const result2 = JSON.parse(JSON.stringify(result))
			if (options.noErrorsCheck !== true) {
				assert.deepStrictEqual(result2.errors ?? [], [])
			}
			return result2
		},
		mailer,
		end: async () => {
			await connection.end()
		},
	}
}

interface TenantContext {
	tester: TenantTester
}


export const testTenantDb = (cb: (ctx: TenantContext) =>  Promise<void>) => {
	return async () => {
		const tester = await createTenantTester()
		await cb({ tester })
		await tester.end()
	}
}
