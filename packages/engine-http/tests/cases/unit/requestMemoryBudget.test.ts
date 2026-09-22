import { expect, test } from 'bun:test'
import { fetch } from 'bun'
import { once } from 'node:events'
import Koa from 'koa'
import { GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'
import { RequestMemoryBudget } from '@contember/database'
import { createLogger, TestLoggerHandler, withLogger } from '@contember/logger'
import { createGraphQLQueryHandler } from '../../../src/graphql/execution.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'
import { readConfig } from '../../../src/config/config.js'

async function request(maxBytes: number, chargeInResolver: boolean, query = '{ body }') {
	const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes })
	const responses: unknown[] = []
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
					swallowed: {
						type: GraphQLString,
						resolve: (_, args, context) => {
							try {
								context.budget.addDatabaseRow({ body: 'x'.repeat(4096) })
							} catch {}
							return 'partial'
						},
					},
				},
			}),
			mutation: new GraphQLObjectType<unknown, { budget: RequestMemoryBudget }>({
				name: 'Mutation',
				fields: {
					write: {
						type: new GraphQLNonNull(GraphQLString),
						resolve: (_, args, context) => {
							context.budget.addDatabaseRow({ body: 'x'.repeat(4096) })
							return 'written'
						},
					},
					report: {
						type: new GraphQLNonNull(GraphQLString),
						resolve: (_, args, context) => {
							try {
								context.budget.addDatabaseRow({ body: 'x'.repeat(4096) })
							} catch {
								return 'exhausted'
							}
							return 'written'
						},
					},
				},
			}),
		}),
		listeners: [{ onResponse: ({ response }) => void responses.push(response) }],
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
		const response = await fetch(`http://127.0.0.1:${address.port}/?query=${encodeURIComponent(query)}`)
		return { status: response.status, body: await response.json(), responses }
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close(error => error ? reject(error) : resolve())
			server.closeAllConnections()
		})
	}
}

test('budget failure inside a nullable resolver returns one resource error with its path and no partial data', async () => {
	const { status, body, responses } = await request(1024, true)
	expect(status).toBe(422)
	expect(body.data).toBeNull()
	expect(body.errors).toEqual([
		expect.objectContaining({ message: 'Request memory budget exceeded', path: ['body'], extensions: { code: 'RESOURCE_EXHAUSTED' } }),
	])
	// Response listeners (debug query log, triggered actions) see the rejected response.
	expect(responses).toEqual([expect.objectContaining({ data: null })])
})

test('a query whose resolver swallowed the budget failure is still rejected as a whole', async () => {
	const { status, body } = await request(1024, true, '{ swallowed }')
	expect(status).toBe(422)
	expect(body).toEqual({
		data: null,
		errors: [{ message: 'Request memory budget exceeded', extensions: { code: 'RESOURCE_EXHAUSTED' } }],
	})
})

test('a mutation that reports budget exhaustion in its own result keeps its data', async () => {
	const { status, body } = await request(1024, true, 'mutation { report }')
	expect({ status, body }).toEqual({ status: 200, body: { data: { report: 'exhausted' } } })
})

test('budget failure thrown by a mutation field is a resource error with its path, not an internal error', async () => {
	const response = await request(1024, true, 'mutation { write }')
	expect(response.status).toBe(422)
	expect(response.body.data).toBeNull()
	expect(response.body.errors).toEqual([
		expect.objectContaining({ message: 'Request memory budget exceeded', path: ['write'], extensions: { code: 'RESOURCE_EXHAUSTED' } }),
	])
})

test('response of a request within its budget is preserved', async () => {
	const { status, body } = await request(32768, false)
	expect({ status, body }).toEqual({ status: 200, body: { data: { body: 'x'.repeat(4096) } } })
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

test('memory budget configuration names the failing option', () => {
	expect(() => serverConfigSchema({ http: { requestMemoryBudget: { warnBytes: 2048, maxBytes: 1024 } } }))
		.toThrow(/http.*requestMemoryBudget.*warnBytes must not exceed maxBytes/)
	expect(() => serverConfigSchema({ http: { requestMemoryBudget: { maxBytes: 1024 } } }))
		.toThrow('warnBytes and maxBytes must be set together')
})

test('memory budget stays disabled when its environment variables are unset', () => {
	expect(serverConfigSchema({ http: { requestMemoryBudget: { warnBytes: undefined, maxBytes: undefined } } }).http?.requestMemoryBudget)
		.toBeUndefined()
})

test('memory budget is configurable through environment variables alone', async () => {
	const names = ['CONTEMBER_HTTP_REQUEST_MEMORY_BUDGET_WARN_BYTES', 'CONTEMBER_HTTP_REQUEST_MEMORY_BUDGET_MAX_BYTES']
	const original = names.map(name => process.env[name])
	try {
		names.forEach(name => delete process.env[name])
		expect((await readConfig()).serverConfig.http?.requestMemoryBudget).toBeUndefined()
		process.env[names[0]] = '1024'
		process.env[names[1]] = '2048'
		expect((await readConfig()).serverConfig.http?.requestMemoryBudget).toEqual({ warnBytes: 1024, maxBytes: 2048 })
	} finally {
		names.forEach((name, index) => {
			if (original[index] === undefined) {
				delete process.env[name]
			} else {
				process.env[name] = original[index]
			}
		})
	}
})
