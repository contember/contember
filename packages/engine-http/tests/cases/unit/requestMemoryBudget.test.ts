import { expect, test } from 'bun:test'
import { fetch } from 'bun'
import { once } from 'node:events'
import Koa from 'koa'
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'
import { RequestMemoryBudget } from '@contember/database'
import { createLogger, TestLoggerHandler, withLogger } from '@contember/logger'
import { createGraphQLQueryHandler } from '../../../src/graphql/execution.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'

async function request(maxBytes: number, chargeInResolver: boolean) {
	const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes })
	const handler = createGraphQLQueryHandler<{ budget: RequestMemoryBudget }>({
		schema: new GraphQLSchema({
			query: new GraphQLObjectType<unknown, { budget: RequestMemoryBudget }>({
				name: 'Query',
				fields: {
					body: {
						type: GraphQLString,
						resolve: (_, args, context) => {
							if (chargeInResolver) {
								context.budget.addDatabaseRow({ body: 'x'.repeat(4096) })
								return null
							}
							return 'x'.repeat(4096)
						},
					},
				},
			}),
		}),
		listeners: [],
		getMemoryBudget: context => context.budget,
	})
	const app = new Koa()
	app.use(async context => {
		await withLogger(
			createLogger(new TestLoggerHandler()),
			() => handler({ request: context.request, response: context.response, createContext: () => ({ budget }) }),
		)
	})
	const server = app.listen(0, '127.0.0.1')
	try {
		await once(server, 'listening')
		const address = server.address()
		if (!address || typeof address === 'string') {
			throw new Error('Expected a TCP listener')
		}
		const response = await fetch(`http://127.0.0.1:${address.port}/?query=${encodeURIComponent('{ body }')}`)
		return { status: response.status, body: await response.json() }
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close(error => error ? reject(error) : resolve())
			server.closeAllConnections()
		})
	}
}

test('budget failure inside a nullable resolver returns one resource error without partial data', async () => {
	const response = await request(1024, true)
	expect(response).toEqual({
		status: 503,
		body: { errors: [{ message: 'Request memory budget exceeded', extensions: { code: 'RESOURCE_EXHAUSTED' } }] },
	})
})

test('oversized completed response is rejected before serialization', async () => {
	expect((await request(1024, false)).status).toBe(503)
})

test('response above the warning threshold and below the maximum is preserved', async () => {
	expect(await request(32768, false)).toEqual({ status: 200, body: { data: { body: 'x'.repeat(4096) } } })
})

test('memory budget configuration rejects invalid or reversed thresholds', () => {
	for (const value of [0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
		expect(() => serverConfigSchema({ http: { requestMemoryBudget: { warnBytes: 1, maxBytes: value } } })).toThrow()
		expect(() => serverConfigSchema({ http: { requestMemoryBudget: { warnBytes: value, maxBytes: 1024 } } })).toThrow()
	}
	expect(() => serverConfigSchema({ http: { requestMemoryBudget: { warnBytes: 2048, maxBytes: 1024 } } })).toThrow()
	expect(serverConfigSchema({ http: { requestMemoryBudget: { warnBytes: 1024, maxBytes: 2048 } } }).http?.requestMemoryBudget)
		.toEqual({ warnBytes: 1024, maxBytes: 2048 })
	expect(serverConfigSchema({}).http?.requestMemoryBudget).toBeUndefined()
})
