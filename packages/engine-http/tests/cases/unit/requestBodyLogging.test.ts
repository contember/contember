import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { VerifyResult } from '@contember/engine-tenant-api'
import { Application, LoggerRequestBody } from '../../../src/application/application.js'
import { Authenticator } from '../../../src/common/Authorizator.js'
import { HttpResponse } from '../../../src/common/HttpResponse.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'
import { ProjectGroupContainer } from '../../../src/projectGroup/ProjectGroupContainer.js'
import { ProjectGroupResolver } from '../../../src/projectGroup/ProjectGroupResolver.js'
import { createMock } from '../../utils.js'

const unavailable = (): never => {
	throw new Error('This service is not available in the request logging test')
}

const createTestApplication = () => {
	const loggerHandler = new TestLoggerHandler()
	const logger = createLogger(loggerHandler)
	const groupContainer: ProjectGroupContainer = {
		slug: 'group',
		logger,
		authenticator: createMock<Authenticator>({
			authenticate: async () => new VerifyResult('identity', 'api-key', ['person'], null),
		}),
		get projectMembershipResolver() {
			return unavailable()
		},
		get projectContainerResolver() {
			return unavailable()
		},
		get projectSchemaResolver() {
			return unavailable()
		},
		get projectInitializer() {
			return unavailable()
		},
		get tenantContainer() {
			return unavailable()
		},
		get tenantGraphQLHandler() {
			return unavailable()
		},
		get systemContainer() {
			return unavailable()
		},
		get systemGraphQLHandler() {
			return unavailable()
		},
	}
	const projectGroupResolver = createMock<ProjectGroupResolver>({
		resolveContainer: async () => groupContainer,
	})
	const application = new Application(projectGroupResolver, serverConfigSchema({ port: 0 }), false, undefined, logger)
	return { application, loggerHandler }
}

test('request logs and error reports carry the operation name and query hash, never the body', async () => {
	const { application, loggerHandler } = createTestApplication()
	application.addRoute('tenant', '/tenant', ({ logger }) => {
		// An error flushes the request's buffered debug entries, which is where the body used to appear.
		logger.error(new Error('Resolver failed'))
		return new HttpResponse(200, 'ok')
	})
	const running = await application.listen()
	const address = running.server.address()
	try {
		if (address === null || typeof address === 'string') {
			throw new Error('The test server did not bind to a TCP port')
		}
		const query = 'mutation SignIn($email: String!, $password: String!) { signIn(email: $email, password: $password) { ok } }'
		const response = await fetch(`http://127.0.0.1:${address.port}/tenant`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ query, operationName: 'SignIn', variables: { email: 'john@example.com', password: 'secret-password' } }),
		})
		expect(response.status).toBe(200)

		const expectedSummary = { operationName: 'SignIn', queryHash: createHash('md5').update(query).digest('hex') }
		const error = loggerHandler.messages.find(it => it.error instanceof Error && it.error.message === 'Resolver failed')
		expect(error?.loggerAttributes[LoggerRequestBody]).toEqual(expectedSummary)
		const started = loggerHandler.messages.find(it => it.message === 'Request processing started')
		expect(started?.ownAttributes.body).toEqual(expectedSummary)

		const logged = loggerHandler.messages.map(it => [it.ownAttributes, it.loggerAttributes[LoggerRequestBody]])
		expect(JSON.stringify(logged)).not.toContain('secret-password')
		expect(JSON.stringify(logged)).not.toContain('john@example.com')
	} finally {
		await running.close()
	}
})
