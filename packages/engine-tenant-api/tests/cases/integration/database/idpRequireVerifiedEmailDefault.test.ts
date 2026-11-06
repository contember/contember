import { expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { graphql } from 'graphql'
import { emptySchema } from '@contember/schema-utils'
import { createLogger, JsonStreamLoggerHandler } from '@contember/logger'
import {
	AclSchemaAccessNodeFactory,
	createResolverContext,
	PermissionContext,
	ProjectScopeFactory,
	Providers,
	StaticIdentity,
	TenantContainerFactory,
	TenantResolverContext,
	typeDefs,
} from '../../../../src/index.js'
import { createConnection, dbCredentials } from '../../../src/dbUtils.js'
import { IdPMock } from '../../../src/IdPMock.js'
import { createMockedMailer } from '../../../src/mailer.js'

const databaseName = process.env.TEST_DB_NAME ?? ''

const databaseConfigured = Boolean(
	process.env.TEST_DB_HOST
		&& process.env.TEST_DB_PORT
		&& process.env.TEST_DB_USER
		&& process.env.TEST_DB_PASSWORD
		&& databaseName,
)

const providers: Providers = {
	uuid: () => crypto.randomUUID(),
	now: () => new Date(),
	randomBytes: async bytes => crypto.randomBytes(bytes),
	bcrypt: async value => value,
	bcryptCompare: async () => false,
	hash: (value, algorithm) => crypto.createHash(algorithm).update(value).digest(),
	encrypt: async value => ({ value, version: 1 }),
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encryptionEnabled: false,
}

test.skipIf(!databaseConfigured)('an IdP added without options does not link an existing account by an unverified e-mail', async () => {
	const slug = `idp-${crypto.randomUUID()}`
	const email = `${crypto.randomUUID()}@example.com`
	const identityId = crypto.randomUUID()
	const personId = crypto.randomUUID()
	const connection = createConnection(databaseName)
	const client = connection.createClient('tenant', { module: 'tenant-idp-verified-email-test' })
	const logger = createLogger(new JsonStreamLoggerHandler(process.stderr))
	const tenantContainer = new TenantContainerFactory(providers)
		.createBuilder({
			mailOptions: {},
			dbCredentials: dbCredentials(databaseName),
			tenantCredentials: {},
			projectInitializer: { initializeProject: () => Promise.reject(new Error('not supported')) },
			projectSchemaResolver: { getSchema: () => Promise.resolve(emptySchema) },
			connection,
			readConnection: connection,
			cryptoProviders: providers,
			logger,
		})
		.replaceService('mailer', () => createMockedMailer())
		.setupService('idpRegistry', registry => {
			registry.registerHandler('mock', new IdPMock())
		})
		.build()
	const schema = makeExecutableSchema({
		typeDefs,
		resolvers: tenantContainer.resolvers,
		resolverValidationOptions: { requireResolversForResolveType: 'ignore' },
	})
	const permissionContext = new PermissionContext(
		new StaticIdentity(crypto.randomUUID(), []),
		{ isAllowed: () => Promise.resolve(true) },
		new ProjectScopeFactory(new AclSchemaAccessNodeFactory()),
		{ getSchema: () => Promise.resolve(emptySchema) },
	)
	const context: TenantResolverContext = {
		...createResolverContext(permissionContext, crypto.randomUUID()),
		logger,
		logAuthAction: async () => {},
		db: tenantContainer.databaseContext,
	}
	const execute = async (source: string, variableValues: Record<string, unknown>) => {
		const response = await graphql({ schema, source, contextValue: context, variableValues })
		expect(response.errors).toBeUndefined()
		return response.data
	}

	try {
		await client.query(
			'INSERT INTO "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") VALUES (?, ?, ?::jsonb, ?, now())',
			[identityId, null, JSON.stringify(['person']), 'idp verified e-mail test'],
		)
		await client.query('INSERT INTO "tenant"."person" ("id", "identity_id", "email") VALUES (?, ?, ?)', [personId, identityId, email])

		expect(
			await execute(
				`mutation($slug: String!, $configuration: Json!) {
					addIDP(identityProvider: $slug, type: "mock", configuration: $configuration) { ok }
				}`,
				{ slug, configuration: { externalIdentifier: crypto.randomUUID(), email, emailVerified: false } },
			),
		).toEqual({ addIDP: { ok: true } })

		expect(
			await execute(
				`mutation($slug: String!) {
					signInIDP(identityProvider: $slug, idpResponse: { url: "test" }, redirectUrl: "test", sessionData: {}) {
						ok
						errors { code }
					}
				}`,
				{ slug },
			),
		).toEqual({ signInIDP: { ok: false, errors: [{ code: 'PERSON_NOT_FOUND' }] } })

		const links = await client.query('SELECT 1 FROM "tenant"."person_identity_provider" WHERE "person_id" = ?', [personId])
		expect(links.rowCount).toBe(0)
	} finally {
		await client.query('DELETE FROM "tenant"."person_identity_provider" WHERE "person_id" = ?', [personId])
		await client.query('DELETE FROM "tenant"."api_key" WHERE "identity_id" = ?', [identityId])
		await client.query('DELETE FROM "tenant"."identity_provider" WHERE "slug" = ?', [slug])
		await client.query('DELETE FROM "tenant"."person" WHERE "id" = ?', [personId])
		await client.query('DELETE FROM "tenant"."identity" WHERE "id" = ?', [identityId])
		await connection.end()
	}
})
