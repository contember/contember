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
import { ProjectScopeFactory } from '../../src/model/authorization/ProjectScopeFactory'
import { AclSchemaEvaluatorFactory } from '../../src/model/authorization/AclSchemaEvaluatorFactory'
import { makeExecutableSchema } from 'graphql-tools'
import { Acl, Schema } from '@contember/schema'
import { createMockedMailer, MockedMailer } from './mailer'
import { dbCredentials, recreateDatabase } from './dbUtils'
import { MigrationsRunner } from '@contember/database-migrations'
import { graphql } from 'graphql'
import { promises } from 'fs'
import { join } from 'path'

export interface Test {
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

interface TenantTester {
	execute(query: GraphQLTestQuery): Promise<any>
	mailer: MockedMailer
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

	const context: ResolverContext = createResolverContext(
		new PermissionContext(
			new StaticIdentity(authenticatedIdentityId, []),
			{
				isAllowed: () => Promise.resolve(true),
			},
			new ProjectScopeFactory(projectSchemaResolver, new AclSchemaEvaluatorFactory()),
		),
		authenticatedApiKeyId,
	)

	const schema = makeExecutableSchema({
		typeDefs: typeDefs,
		resolvers: tenantContainer.resolvers as any,
		resolverValidationOptions: {
			requireResolversForResolveType: false,
		},
	})

	return {
		async execute(query: GraphQLTestQuery): Promise<any> {
			return await graphql(
				schema,
				typeof query === 'string' ? query : query.query,
				null,
				context,
				typeof query === 'string' ? undefined : query.variables,
			)
		},
		mailer,
	}
}
