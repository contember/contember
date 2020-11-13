import { GraphQLTestQuery } from '../cases/integration/mocked/gql/types'
import { testUuid } from './testUuid'
import { ProjectSchemaResolver } from '../../src/model/type'
import {
	createResolverContext,
	PermissionContext,
	ResolverContext,
	StaticIdentity,
	TenantContainer,
	typeDefs,
} from '../../src'
import { Buffer } from 'buffer'
import { ProjectScopeFactory } from '../../src/model/authorization/ProjectScopeFactory'
import { AclSchemaEvaluatorFactory } from '../../src/model/authorization/AclSchemaEvaluatorFactory'
import { makeExecutableSchema } from 'graphql-tools'
import { executeGraphQlTest } from './testGraphql'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { Acl, Schema } from '@contember/schema'
import { createMockedMailer, ExpectedMessage } from './mailer'
import * as assert from 'uvu/assert'

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

const projectSchemaResolver: ProjectSchemaResolver = project => Promise.resolve(schema)

export const authenticatedIdentityId = testUuid(999)
export const authenticatedApiKeyId = testUuid(998)

export const executeTenantTest = async (test: Test) => {
	const mailer = createMockedMailer()
	const tenantContainer = new TenantContainer.Factory()
		.createBuilder(
			{
				database: 'foo',
				host: 'localhost',
				port: 5432,
				password: '123',
				user: 'foo',
			},
			{},
			{
				bcrypt: (value: string) => Promise.resolve('BCRYPTED-' + value),
				bcryptCompare: (data: string, hash: string) => Promise.resolve('BCRYPTED-' + data === hash),
				now: () => now,
				randomBytes: (length: number) => Promise.resolve(Buffer.alloc(length)),
				uuid: createUuidGenerator(),
			},
			projectSchemaResolver,
		)
		.replaceService('connection', () => createConnectionMock(test.executes))
		.replaceService('mailer', () => mailer)
		.build()

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
