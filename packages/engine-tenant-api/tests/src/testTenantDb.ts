import { GraphQLTestQuery } from '../cases/integration/mocked/gql/types'
import { testUuid } from './testUuid'
import { ProjectSchemaResolver } from '../../src/model/type'
import {
	createResolverContext,
	PermissionContext,
	ResolverContext,
	StaticIdentity,
	TenantContainer,
	TenantMigrationArgs,
	typeDefs,
} from '../../src'
import { Buffer } from 'buffer'
import { makeExecutableSchema } from 'graphql-tools'
import { Acl, Schema } from '@contember/schema'
import { createMockedMailer, MockedMailer } from './mailer'
import { dbCredentials, recreateDatabase } from './dbUtils'
import { MigrationsRunner } from '@contember/database-migrations'
import { graphql } from 'graphql'
import { promises } from 'fs'
import { join } from 'path'
import { Membership } from '../../src/model/type/Membership'
import { Connection } from '@contember/database'
import * as uvu from 'uvu'

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
	model: { entities: {}, enums: {} },
	validation: {},
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

const projectSchemaResolver: ProjectSchemaResolver = project => Promise.resolve(schema)

export const authenticatedIdentityId = testUuid(999)
export const authenticatedApiKeyId = testUuid(998)

interface TenantTestOptions {
	membership?: Membership
	roles?: string[]
}

export interface TenantTester {
	execute(query: GraphQLTestQuery, options?: TenantTestOptions): Promise<any>
	mailer: MockedMailer
	end: () => Promise<void>
}

const getMigrationsDir = async () => {
	const distPath = join(__dirname, '/../../../migrations')
	const srcPath = join(__dirname, '/../../migrations')
	try {
		await promises.stat(distPath)
		return distPath
	} catch (e) {
		if (e.code === 'ENOENT') {
			return srcPath
		}
		throw e
	}
}

export const createTenantTester = async (): Promise<TenantTester> => {
	const dbName = String(process.env.TEST_DB_NAME)
	const credentials = dbCredentials(dbName)
	const conn = await recreateDatabase(dbName)
	await conn.end()
	const migrationsRunner = new MigrationsRunner(credentials, 'tenant', await getMigrationsDir())
	const providers = {
		bcrypt: (value: string) => Promise.resolve('BCRYPTED-' + value),
		bcryptCompare: (data: string, hash: string) => Promise.resolve('BCRYPTED-' + data === hash),
		now: () => now,
		randomBytes: (length: number) => Promise.resolve(Buffer.alloc(length)),
		uuid: createUuidGenerator(),
	}

	await migrationsRunner.migrate<TenantMigrationArgs>(false, {
		credentials: {},
		providers,
	})
	const mailer = createMockedMailer()
	const tenantContainer = new TenantContainer.Factory()
		.createBuilder(credentials, {}, providers, projectSchemaResolver)
		.replaceService('mailer', () => mailer)
		.build()

	await tenantContainer.projectManager.createOrUpdateProject({ slug: 'blog', name: 'blog' })

	const schema = makeExecutableSchema({
		typeDefs: typeDefs,
		resolvers: tenantContainer.resolvers as any,
		resolverValidationOptions: {
			requireResolversForResolveType: 'ignore',
		},
	})

	return {
		async execute(query: GraphQLTestQuery, options: TenantTestOptions = {}): Promise<any> {
			const context: ResolverContext = createResolverContext(
				new PermissionContext(
					new StaticIdentity(authenticatedIdentityId, options.roles || [], {
						blog: [options.membership || { role: 'admin', variables: [] }],
					}),
					tenantContainer.authorizator,
					tenantContainer.projectScopeFactory,
				),
				authenticatedApiKeyId,
			)
			const result = await graphql(
				schema,
				typeof query === 'string' ? query : query.query,
				null,
				context,
				typeof query === 'string' ? undefined : query.variables,
			)
			return JSON.parse(JSON.stringify(result))
		},
		mailer,
		end: async () => {
			await (tenantContainer.connection as Connection).end()
		},
	}
}

interface TenantContext {
	tester: TenantTester
}

export const dbSuite = (title: string) => {
	const dbSuite = uvu.suite<TenantContext>(title)
	dbSuite.before.each(async ctx => {
		ctx.tester = await createTenantTester()
	})
	dbSuite.after.each(async ctx => {
		await ctx.tester.end()
	})
	return dbSuite
}
