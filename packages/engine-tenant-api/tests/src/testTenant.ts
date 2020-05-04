import { GraphQLTestQuery } from '../cases/integration/mocked/gql/types'
import { testUuid } from './testUuid'
import { ProjectSchemaResolver } from '../../src/model/type'
import {
	createResolverContext,
	Mailer,
	MailMessage,
	PermissionContext,
	ResolverContext,
	SentInfo,
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

export interface Test {
	query: GraphQLTestQuery
	executes: ExpectedQuery[]
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

export const executeTenantTest = async (test: Test) => {
	const mails = (test.sentMails || []).reverse()
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
		.replaceService('connection', () =>
			createConnectionMock(test.executes, (expected, actual, message) => {
				expect(actual).toEqual(expected, message)
			}),
		)
		.replaceService(
			'mailer',
			() =>
				new (class implements Mailer {
					async send(message: MailMessage): Promise<SentInfo> {
						const mail = mails.pop()
						if (!mail) {
							throw new Error(`Unexpected mail ${message.subject}`)
						}
						expect(message.subject).toEqual(mail.subject)
						return {}
					}
				})(),
		)
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
			requireResolversForResolveType: false,
		},
	})
	await executeGraphQlTest({
		context: context,
		query: typeof test.query === 'string' ? test.query : test.query.query,
		queryVariables: typeof test.query === 'string' ? undefined : test.query.variables,
		return: test.return,
		schema: schema,
	})
}
