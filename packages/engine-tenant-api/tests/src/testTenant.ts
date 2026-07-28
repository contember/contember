import { GraphQLTestQuery } from '../cases/integration/mocked/gql/types.js'
import { testUuid } from './testUuid.js'
import {
	AclSchemaAccessNodeFactory,
	createResolverContext,
	Identity,
	PermissionContext,
	ProjectSchemaResolver,
	ProjectScopeFactory,
	Providers,
	StaticIdentity,
	TenantContainerFactory,
	TenantResolverContext,
	typeDefs,
} from '../../src/index.js'
import { Authorizator } from '@contember/authorization'
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
	httpInfo?: { ip?: string; userAgent?: string; geoCountry?: string }
	/** Override individual providers (e.g. a working `decrypt` to enable captcha). */
	providers?: Partial<Providers>
	/**
	 * Tenant roles of the authenticated identity (default: none). Setting this switches the
	 * context to the REAL authorization stack — the static permission map plus
	 * `CustomRoleAuthorizator` — instead of the allow-everything default, so the test
	 * actually exercises what these roles may do. Custom-role slugs listed here trigger the
	 * request-scoped `custom_role` lookup, which must appear in `executes`.
	 */
	identityRoles?: string[]
	/**
	 * Override the authorizator. Without this and without `identityRoles`, every action is
	 * allowed; pass a custom one to exercise forbidden / partially-allowed ACL branches.
	 */
	authorizator?: Authorizator<Identity>
	/**
	 * Override the project schema resolver (default: a fixed schema defining roles `editor` / `reviewer`).
	 * Pass `{ getSchema: () => Promise.resolve(undefined) }` to exercise the unresolvable-schema branch of
	 * the A09 apply-time backstop.
	 */
	projectSchemaResolver?: ProjectSchemaResolver
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
					// A condition variable for the claim-mapping config-validation tests. It carries a `fallback`
					// so it is OPTIONAL — a membership that doesn't set it (e.g. createApiKey's editor grant)
					// stays valid instead of failing with VARIABLE_EMPTY.
					siteFilter: {
						type: Acl.VariableType.condition,
						fallback: { never: true },
					},
					// An entity variable used by the claim-mapping apply tests (a claim mapped to locale ids).
					// Carries a `fallback` so it stays OPTIONAL on the direct add-member path, while A09's
					// apply-time backstop now drops a grant naming a role/variable absent from the live ACL — so
					// the variable must exist here for the happy-path apply tests to validate and be applied.
					locale: {
						type: Acl.VariableType.entity,
						entityName: 'Locale',
						fallback: { never: true },
					},
				},
			},
			// A second project role for the claim-mapping reconciliation tests (unmatched: remove grants and
			// strips both `editor` and `reviewer`). Must exist in the live ACL or A09's apply-time backstop
			// drops the grant for it.
			reviewer: {
				stages: '*',
				entities: {},
				variables: {},
			},
		},
	},
}

const defaultProjectSchemaResolver: ProjectSchemaResolver = {
	getSchema: project => Promise.resolve(schema),
}

export const authenticatedIdentityId = testUuid(999)
export const authenticatedApiKeyId = testUuid(998)

export const executeTenantTest = async (test: Test) => {
	const mailer = createMockedMailer()
	const projectSchemaResolver = test.projectSchemaResolver ?? defaultProjectSchemaResolver
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
	// `identityRoles` means "evaluate what these roles really may do", so it routes through
	// the container's PermissionContextFactory — the static map plus CustomRoleAuthorizator.
	// Without it (and without an explicit authorizator) the default stays allow-everything,
	// which is what the bulk of these tests want.
	const permissionContext = test.authorizator === undefined && test.identityRoles !== undefined
		? await tenantContainer.permissionContextFactory.createPreloaded(databaseContext, {
			id: authenticatedIdentityId,
			roles: test.identityRoles,
		})
		: new PermissionContext(
			new StaticIdentity(authenticatedIdentityId, test.identityRoles ?? []),
			test.authorizator ?? {
				isAllowed: () => Promise.resolve(true),
			},
			new ProjectScopeFactory(new AclSchemaAccessNodeFactory()),
			projectSchemaResolver,
		)
	const context: TenantResolverContext = {
		...createResolverContext(
			permissionContext,
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
		httpInfo: { ip: test.httpInfo?.ip ?? '', userAgent: test.httpInfo?.userAgent, geoCountry: test.httpInfo?.geoCountry },
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
