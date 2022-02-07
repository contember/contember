import { GraphQLTestQuery } from '../cases/integration/mocked/gql/types'
import { testUuid } from './testUuid'
import {
	AclSchemaEvaluatorFactory,
	createResolverContext,
	PermissionContext,
	ProjectSchemaResolver,
	ProjectScopeFactory,
	Providers,
	StaticIdentity,
	TenantContainerFactory,
	TenantResolverContext,
	typeDefs,
} from '../../src'
import { Buffer } from 'buffer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { executeGraphQlTest } from './testGraphql'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { Acl, Schema } from '@contember/schema'
import { createMockedMailer, ExpectedMessage } from './mailer'

export interface Test {
	query: GraphQLTestQuery
	executes: ExpectedQuery[]
	return: object
	sentMails?: ExpectedMessage[]
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

const projectSchemaResolver: ProjectSchemaResolver = {
	getSchema: project => Promise.resolve(schema),
}

export const authenticatedIdentityId = testUuid(999)
export const authenticatedApiKeyId = testUuid(998)

export const executeTenantTest = async (test: Test) => {
	const mailer = createMockedMailer()
	const providers: Providers = {
		bcrypt: (value: string) => Promise.resolve('BCRYPTED-' + value),
		bcryptCompare: (data: string, hash: string) => Promise.resolve('BCRYPTED-' + data === hash),
		now: () => now,
		randomBytes: (length: number) => Promise.resolve(Buffer.alloc(length)),
		uuid: createUuidGenerator(),
		decrypt: () => {
			throw new Error('not supported')
		},
		encrypt: () => {
			throw new Error('not supported')
		},
		hash: value => Buffer.from(value.toString()),
	}
	const projectInitializer = {
		initializeProject: () => {
			throw new Error()
		},
	}
	const connection = createConnectionMock(test.executes)
	const tenantContainer = new TenantContainerFactory(providers)
		.createBuilder({
			mailOptions: {},
			tenantCredentials: {},
			projectInitializer,
			projectSchemaResolver,
			connection,
		})
		.replaceService('mailer', () => mailer)
		.build()

	const databaseContext = tenantContainer.databaseContext
	const context: TenantResolverContext = {
		...createResolverContext(
			new PermissionContext(
				new StaticIdentity(authenticatedIdentityId, []),
				{
					isAllowed: () => Promise.resolve(true),
				},
				new ProjectScopeFactory(new AclSchemaEvaluatorFactory()),
				projectSchemaResolver,
			),
			authenticatedApiKeyId,
		),
		db: databaseContext,
	}

	const schema = makeExecutableSchema({
		typeDefs: typeDefs,
		resolvers: tenantContainer.resolvers as any,
		resolverValidationOptions: {
			requireResolversForResolveType: 'ignore',
		},
	})
	await executeGraphQlTest({
		context: context,
		query: typeof test.query === 'string' ? test.query : test.query.query,
		queryVariables: typeof test.query === 'string' ? undefined : test.query.variables,
		return: test.return,
		schema: schema,
	})
	for (const email of test.sentMails || []) {
		mailer.expectMessage(email)
	}
	mailer.expectEmpty()
}
