import { GraphQLTestQuery } from '../cases/integration/mocked/gql/types.js'
import { testUuid } from './testUuid.js'
import {
	createResolverContext,
	PermissionContext,
	PermissionContextFactory,
	ProjectSchemaResolver,
	Providers,
	StaticIdentity,
	TenantContainerFactory,
	TenantResolverContext,
	TenantRole,
	typeDefs,
} from '../../src/index.js'
import { Buffer } from 'buffer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { executeGraphQlTest } from './testGraphql.js'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { Acl, Schema } from '@contember/schema'
import { createMockedMailer, ExpectedMessage } from './mailer.js'
import { dbCredentials } from './dbUtils.js'
import { IdPMock } from './IdPMock.js'
import { createLogger, JsonStreamLoggerHandler } from '@contember/logger'
import { emptySchema } from '@contember/schema-utils'
import { expect } from 'bun:test'
import { AuthLogService } from '../../src/model/service/AuthLogService.js'

export interface Test {
	query: GraphQLTestQuery
	executes: ExpectedQuery[]
	return: object
	sentMails?: ExpectedMessage[]
	/** A single expected auth log, or a sequence of them when the mutation emits more than one. */
	expectedAuthLog?: AuthLogService.LogArgs | AuthLogService.LogArgs[]
	callerTrustForwardedInfo?: boolean
	httpInfo?: { ip?: string; userAgent?: string }
	/** Override individual providers (e.g. a working `decrypt` to enable captcha). */
	providers?: Partial<Providers>
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

// Minimal stand-in for `DatabaseContext` used only by the `PermissionContext`
// authorization path. Only `queryHandler.fetch` is reached — and only for the
// `IdentityPolicyAssignmentsQuery`, for which empty rows mean "no custom-policy
// assignments for this identity".
const stubDatabaseContextForAuth = {
	queryHandler: {
		fetch: async () => [],
	},
} as any

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
		encryptionEnabled: false,
		hash: value => Buffer.from(value.toString()),
		...test.providers,
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
			dbCredentials: dbCredentials('xx'),
			tenantCredentials: {},
			projectInitializer,
			projectSchemaResolver,
			connection,
			readConnection: connection,
			cryptoProviders: providers,
		})
		.replaceService('mailer', () => mailer)
		.replaceService(
			// Integration tests assert a strict SQL queue. Custom-policy lookups
			// (`identity_policy`) would otherwise fire at every authorization site —
			// swap in a stub policy DB context that reports "no assignments"; the
			// built-in role policies on the test identity then authorize as expected.
			'permissionContextFactory',
			({ identityFactory, projectSchemaResolver }) => new PermissionContextFactory(identityFactory, projectSchemaResolver, stubDatabaseContextForAuth),
		)
		.setupService('idpRegistry', reg => {
			reg.registerHandler('mock', new IdPMock())
		})
		.build()

	const expectedAuthLogs = test.expectedAuthLog === undefined
		? undefined
		: Array.isArray(test.expectedAuthLog)
		? [...test.expectedAuthLog]
		: [test.expectedAuthLog]

	const databaseContext = tenantContainer.databaseContext
	const context: TenantResolverContext = {
		...createResolverContext(
			new PermissionContext(
				// Tests assume the authenticated identity has unrestricted tenant
				// access — granted via the built-in `super_admin` policy.
				new StaticIdentity(authenticatedIdentityId, [TenantRole.SUPER_ADMIN]),
				stubDatabaseContextForAuth,
				projectSchemaResolver,
			),
			authenticatedApiKeyId,
			test.callerTrustForwardedInfo ?? false,
		),
		logger: createLogger(new JsonStreamLoggerHandler(process.stderr)),
		logAuthAction: async args => {
			if (!expectedAuthLogs || expectedAuthLogs.length === 0) {
				console.log(JSON.stringify(args))
				throw new Error('No expected auth log')
			}
			expect(args).toEqual(expectedAuthLogs.shift()!)
		},
		db: databaseContext,
		httpInfo: { ip: test.httpInfo?.ip ?? '', userAgent: test.httpInfo?.userAgent },
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
	expect(test.executes).toHaveLength(0)
	if (expectedAuthLogs) {
		expect(expectedAuthLogs).toHaveLength(0)
	}
}
