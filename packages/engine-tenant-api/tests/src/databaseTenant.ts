import crypto from 'node:crypto'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { graphql } from 'graphql'
import { emptySchema } from '@contember/schema-utils'
import { createLogger, JsonStreamLoggerHandler } from '@contember/logger'
import { Providers, Schema, TenantContainerFactory, typeDefs } from '../../src/index.js'
import { createConnection, dbCredentials } from './dbUtils.js'
import { IdPMock } from './IdPMock.js'
import { createMockedMailer } from './mailer.js'

export const databaseName = process.env.TEST_DB_NAME ?? ''

export const databaseConfigured = Boolean(
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
	bcrypt: async value => `bcrypted:${value}`,
	bcryptCompare: async (data, hash) => hash === `bcrypted:${data}`,
	hash: (value, algorithm) => crypto.createHash(algorithm).update(value).digest(),
	encrypt: async value => ({ value, version: 1 }),
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encryptionEnabled: false,
}

/**
 * The tenant API over the test database, with the real resolvers, authorization and auth log, the `mock` IdP
 * registered and mail discarded. Requests run as an existing identity with the given tenant roles.
 */
export const createDatabaseTenant = () => {
	const connection = createConnection(databaseName)
	const logger = createLogger(new JsonStreamLoggerHandler(process.stderr))
	const container = new TenantContainerFactory(providers, null)
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
	const resolvers: Schema.Resolvers = container.resolvers
	const schema = makeExecutableSchema({
		typeDefs,
		resolvers,
		resolverValidationOptions: { requireResolversForResolveType: 'ignore' },
	})

	return {
		client: container.databaseContext.client,
		providers,
		execute: async (
			auth: { identityId: string; roles: string[] },
			source: string,
			variableValues: Record<string, unknown> = {},
		) => {
			const context = await container.resolverContextFactory.create(
				{ apiKeyId: crypto.randomUUID(), identityId: auth.identityId, roles: auth.roles },
				{ ip: '127.0.0.1' },
				container.databaseContext,
				logger,
			)
			return await graphql({ schema, source, contextValue: context, variableValues })
		},
		end: () => connection.end(),
	}
}
